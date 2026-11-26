# Shopper Pixel World

Explore twelve saved German shopping simulations. The viewer includes shopper choices, product photos, and German, Traditional Chinese, and Korean display options.

## Run locally

With Python 3 installed, run these commands:

```sh
git clone https://github.com/pantageepapa/shopper-pixel-world.git
cd shopper-pixel-world
python3 -m http.server 8094 --bind 127.0.0.1
```

Open [the Essential Kite study, shopper P38, round 2](http://127.0.0.1:8094/shopper-viewer/?wave=12&shopper=p38&round=2). Use the simulation selector to explore earlier studies. The replay reads saved files and requires no API keys. The separate live MiroFish monitor requires the original backend on port 3000.
