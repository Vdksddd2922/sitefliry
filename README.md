# Estalo — wingman de respostas

App em Next.js (frontend + backend juntos) que recebe um print ou texto de uma
conversa e sugere 3 respostas, usando a API do OpenRouter.

Não gera conteúdo sexual explícito — o foco é charme, humor e confiança.

## 1. Pré-requisitos

- [Node.js](https://nodejs.org) 18 ou mais recente instalado
- Uma chave de API do OpenRouter: crie em https://openrouter.ai/keys
  (crie uma chave gratuita ou com créditos para usar o modelo gemma-4-31b-it:free)

## 2. Rodar localmente

```bash
cd estalo-wingman
npm install
cp .env.example .env.local
```

Abra `.env.local` e cole sua `OPENROUTER_API_KEY`. Se quiser proteger o app com uma
senha simples, defina também `ACCESS_CODE`.

```bash
npm run dev
```

Acesse http://localhost:3000

## 3. Deploy grátis na Vercel (via CLI)

```bash
npm install -g vercel
vercel login
```

Dentro da pasta do projeto:

```bash
vercel
```

Responda as perguntas (aceite os valores padrão). Isso cria um deploy de preview.

Configure as variáveis de ambiente no projeto criado:

```bash
vercel env add OPENROUTER_API_KEY production
# cole a chave quando for solicitado

# opcional:
vercel env add ACCESS_CODE production
```

Depois faça o deploy de produção:

```bash
vercel --prod
```

A Vercel vai te dar uma URL pública (ex: `estalo-wingman.vercel.app`). O plano
Hobby da Vercel é gratuito e é suficiente para uso pessoal.

## 4. Notas importantes

- **Custo**: quem paga pelas chamadas à IA é a sua chave do OpenRouter (gratuita ou cobrada por
  uso, não é assinatura). Se você não definir `ACCESS_CODE`, qualquer pessoa com o
  link do deploy pode gerar respostas e gastar seu crédito — por isso o app tem
  essa proteção opcional por senha.
- **Imagens**: o app redimensiona o print no navegador antes de enviar, pra manter
  o custo baixo.
- **Idioma**: as sugestões saem automaticamente no mesmo idioma da conversa enviada.

## 5. Estrutura do projeto

```
app/
  page.tsx                    → interface (upload de print / texto, tons, resultados)
  layout.tsx                  → fontes e metadata
  globals.css                 → estilos base (Tailwind)
  api/generate-reply/route.ts → backend: fala com a API do OpenRouter
```
