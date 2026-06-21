Antes de iniciar a instalação e execução do projeto, certifique-se de ter o **`Conda`** instalado e as dependências Python do backend, além do **`Node.js`** com o **`npm`**  para a instalação dos pacotes e execução do servidor de desenvolvimento do frontend.

### Backend (Python / FastAPI)

1. Acesse o diretório:

```bash
cd network-topology-backend

```

2. Ative o ambiente (Conda):

```bash
conda activate Redes2

```

3. Instale as dependências:

```bash
pip install -r requirements.txt

```

4. Inicie o servidor (exige `sudo` para o rastreamento de rede):

```bash
sudo $(which python) -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

```

---

### Frontend (Node.js / React)

1. Abra um novo terminal e acesse o diretório:

```bash
cd network-topology-frontend

```

2. Instale as dependências:

```bash
npm install

```

3. Inicie a aplicação:

```bash
npm run dev

```