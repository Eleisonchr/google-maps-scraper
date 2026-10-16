# Imagem Docker do fork

Execute os comandos na raiz do repositório (`E:\Scraper`). O contexto de build deve ser a raiz, pois contém o código e os arquivos `go.mod` e `go.sum`.

## Criar ou atualizar a imagem

```powershell
docker build -f Docker/Dockerfile -t scraper:local .
```

Repita o comando após alterar o código. O Docker reutiliza as camadas de dependências e recompila a aplicação quando os fontes mudam. Containers existentes precisam ser recriados para usar a nova imagem.

## Executar a interface web

```powershell
docker run --rm --name scraper -p 8080:8080 -v scraperDados:/gmapsdata scraper:local -web -data-folder /gmapsdata
```

Acesse http://localhost:8080. Os dados ficam no volume `scraperDados`, preservado entre execuções.

Para parar o container, execute `docker stop scraper` em outro terminal. Depois de reconstruir a imagem, execute novamente o comando `docker run`.

O build requer Docker com containers Linux e acesso à internet para baixar as imagens base, os módulos Go e o Chromium. A configuração mantém as versões e dependências do Dockerfile original da raiz.
