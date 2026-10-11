# Ultimate XOX

Single-player Ultimate XOX igra napravljena u Vue 3. Projekat ima Minimax protivnika, opcioni ChatGPT režim, tajmer i pregled odigrane partije.

## Pokretanje projekta

Za osnovnu verziju projekta nije potreban API ključ niti Node AI server. Minimax protivnik radi direktno u browseru.

```powershell
npm install
npm run dev
```

Otvori URL koji Vite prikaže, najčešće `http://localhost:5173`, i ostavi režim **Minimax — napredni AI**.

## Opciono: ChatGPT protivnik

ChatGPT režim zahteva OpenAI API ključ i dva PowerShell prozora.

1. Napravite lokalni `.env` fajl na osnovu šablona:

   ```powershell
   Copy-Item .env.example .env
   ```

2. U `.env` upišite svoj API ključ:

   ```text
   OPENAI_API_KEY=vas_openai_api_kljuc
   ```

3. Pokrenite lokalni AI server:

   ```powershell
   npm.cmd run ai-server
   ```

4. U drugom prozoru pokrenite Vue aplikaciju:

   ```powershell
   npm.cmd run dev
   ```

Otvorite URL koji Vite prikaže. Frontend šalje stanje igre na lokalnu `/api/ai-move` rutu, a Node server zatim šalje zahtev OpenAI-ju. API ključ ostaje samo u lokalnom `.env` fajlu.

`.env` je namerno dodat u `.gitignore` i ne treba ga slati na GitHub. `.env.example` je bezbedan šablon koji može biti deo repozitorijuma.

Posle svakog AI poteza server čuva kratak izveštaj u `logs/partija_<vreme-početka>.md`. U njemu su datum poteza, potez robota, moguće taktičke alternative i kratko objašnjenje koje je vratio model.
