from django.apps import AppConfig
import atexit
from django.utils.module_loading import import_string


class AuditConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'audit'

    def ready(self):
        # Log system startup and register shutdown handler
        try:
            from .utils import log_system_event
            log_system_event('System startup', 'Django application started')

            def on_shutdown():
                try:
                    log_system_event('System shutdown', 'Django application stopping')
                except Exception:
                    pass

            atexit.register(on_shutdown)
        except Exception:
            # Avoid startup failures due to logging issues
            pass
