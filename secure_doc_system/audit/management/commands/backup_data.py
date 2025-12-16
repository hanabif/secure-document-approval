import os
import shutil
import tempfile
from pathlib import Path
from datetime import datetime

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.core.management import call_command

from audit.utils import log_system_event


class Command(BaseCommand):
    help = "Create a zip archive backup of the database and media files, with retention."

    def handle(self, *args, **options):
        backup_dir: Path = Path(getattr(settings, 'BACKUP_DIR', Path(settings.BASE_DIR) / 'backups'))
        retention: int = int(getattr(settings, 'BACKUP_RETENTION', 7))
        backup_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        tmp_root = Path(tempfile.mkdtemp(prefix=f'backup_{timestamp}_'))
        try:
            # 1) Database backup
            db_engine = settings.DATABASES['default']['ENGINE']
            db_name = settings.DATABASES['default']['NAME']
            db_target_dir = tmp_root / 'database'
            db_target_dir.mkdir(parents=True, exist_ok=True)

            if 'sqlite' in db_engine:
                src = Path(db_name)
                if not src.exists():
                    raise CommandError(f'SQLite database file not found at {src}')
                shutil.copy2(src, db_target_dir / src.name)
            else:
                # For non-SQLite, dump JSON as a generic snapshot
                with open(db_target_dir / 'dump.json', 'w', encoding='utf-8') as f:
                    call_command('dumpdata', '--natural-foreign', '--natural-primary', stdout=f)

            # 2) Media files
            media_root = Path(getattr(settings, 'MEDIA_ROOT', ''))
            if media_root and media_root.exists():
                media_target = tmp_root / 'media'
                shutil.copytree(media_root, media_target)

            # 3) Zip archive
            archive_name = backup_dir / f'backup_{timestamp}'
            archive_path = shutil.make_archive(str(archive_name), 'zip', root_dir=tmp_root)

            # 4) Retention cleanup
            self._enforce_retention(backup_dir, retention)

            # 5) Log success
            try:
                log_system_event('Backup created', f'Backup archive: {archive_path}')
            except Exception:
                pass

            self.stdout.write(self.style.SUCCESS(f'Backup created: {archive_path}'))
        except Exception as e:
            try:
                log_system_event('Backup failed', str(e), severity='CRITICAL')
            except Exception:
                pass
            raise
        finally:
            # Clean tmp
            try:
                shutil.rmtree(tmp_root, ignore_errors=True)
            except Exception:
                pass

    def _enforce_retention(self, backup_dir: Path, retention: int):
        try:
            archives = sorted(
                [p for p in backup_dir.glob('backup_*.zip') if p.is_file()],
                key=lambda p: p.stat().st_mtime,
                reverse=True,
            )
            for old in archives[retention:]:
                try:
                    old.unlink(missing_ok=True)
                except Exception:
                    pass
        except Exception:
            pass
