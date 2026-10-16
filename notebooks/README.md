# Notebooks

Reserved for viva/demo walkthroughs (data exploration, membership-function plots,
training curves). Generate plots from `backend/models/metrics.json` after training:

```bash
curl -X POST http://localhost:8000/api/train
python3 -c "import json; print(json.load(open('backend/models/metrics.json'))['models'])"
```
