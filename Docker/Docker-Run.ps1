$ErrorActionPreference = 'Stop'

docker run -d `
    --name Scrapper-Cnf `
    --restart no `
    --network bridge `
    -p 9991:8080 `
    --mount 'type=bind,source=S:\scrap,target=/gmapsdata' `
    scraper:local `
    -web `
    -data-folder /gmapsdata `
    -c 2

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
