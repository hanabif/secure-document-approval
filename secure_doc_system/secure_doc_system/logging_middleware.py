import logging
import json
from django.utils.deprecation import MiddlewareMixin
from audit.utils import log_user_action
from django.utils import timezone
import traceback
from django.http.request import RawPostDataException

logger = logging.getLogger(__name__)

class UserActivityMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.start_time = timezone.now()

    def process_response(self, request, response):
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return response

        end_time = timezone.now()
        duration = (end_time - request.start_time).total_seconds()

        log_entry = {
            'user': request.user.username,
            'ip_address': request.META.get('REMOTE_ADDR'),
            'method': request.method,
            'path': request.path,
            'status_code': response.status_code,
            'response_time': duration,
            'timestamp': end_time.isoformat(),
        }

        try:
            # Attempt to safely log request and response data
            if request.method in ['POST', 'PUT', 'PATCH'] and request.content_type == 'application/json':
                try:
                    log_entry['request_body'] = json.loads(request.body)
                except (json.JSONDecodeError, UnicodeDecodeError):
                    log_entry['request_body'] = 'Could not decode request body'
                except RawPostDataException:
                     log_entry['request_body'] = 'Body already consumed'

            # Do not log sensitive response data
            if 'application/json' in response.get('Content-Type', ''):
                # Avoid logging large responses
                if len(response.content) < 10000:
                    try:
                        log_entry['response_body'] = json.loads(response.content)
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        log_entry['response_body'] = 'Could not decode response body'

            log_user_action(
                request,
                action=f'{request.method} {request.path}',
                details=json.dumps(log_entry)
            )

        except Exception as e:
            logger.error(f"Failed to log user activity: {e}\n{traceback.format_exc()}")
            
        return response
