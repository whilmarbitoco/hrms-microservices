import bleach


def sanitize_string(value):
    if not isinstance(value, str):
        return value
    return bleach.clean(value, tags=[], strip=True).strip()


def sanitize_dict(data):
    if not isinstance(data, dict):
        return data
    return {
        k: sanitize_dict(v) if isinstance(v, dict)
        else [sanitize_dict(i) if isinstance(i, dict) else sanitize_string(i) if isinstance(i, str) else i for i in v] if isinstance(v, list)
        else sanitize_string(v) if isinstance(v, str)
        else v
        for k, v in data.items()
    }
