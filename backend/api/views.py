from django.http import JsonResponse


def health(_request):
    return JsonResponse({"ok": True})


def hello(_request):
    return JsonResponse({"message": "Hello from Django API"})

