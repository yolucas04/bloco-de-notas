const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.json({ mensagem: 'API de Bloco de Notas funcional!' });
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Garante a criação da tabela
pool.query(`
  CREATE TABLE IF NOT EXISTS notas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    conteudo TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).then(() => console.log('Tabela "notas" verificada.'))
  .catch(err => console.error('Erro na tabela:', err.message));

// 1. CRIAR NOTA (Create)
app.post('/notas', async (req, res) => {
  try {
    const { titulo, conteudo } = req.body;
    if (!titulo || !conteudo) {
      return res.status(400).json({ erro: 'Título e conteúdo são obrigatórios.' });
    }

    const result = await pool.query(
      'INSERT INTO notas (titulo, conteudo) VALUES ($1, $2) RETURNING *',
      [titulo, conteudo]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro no POST:', error.message);
    res.status(500).json({ erro: error.message });
  }
});

// 2. LISTAR TODAS AS NOTAS (Read All)
app.get('/notas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notas ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro no GET /notas:', error.message);
    res.status(500).json({ erro: error.message });
  }
});

// 3. BUSCAR UMA NOTA POR ID (Read One)
app.get('/notas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ erro: 'ID inválido.' });

    const result = await pool.query('SELECT * FROM notas WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Nota não encontrada.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro no GET /notas/:id:', error.message);
    res.status(500).json({ erro: error.message });
  }
});

// 4. ATUALIZAR NOTA (Update)
app.put('/notas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ erro: 'ID inválido.' });

    const { titulo, conteudo } = req.body;
    const result = await pool.query(
      'UPDATE notas SET titulo = $1, conteudo = $2 WHERE id = $3 RETURNING *',
      [titulo, conteudo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Nota não encontrada.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro no PUT /notas/:id:', error.message);
    res.status(500).json({ erro: error.message });
  }
});

// 5. APAGAR NOTA (Delete)
app.delete('/notas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ erro: 'ID inválido.' });

    const result = await pool.query('DELETE FROM notas WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Nota não encontrada.' });
    }
    res.json({ mensagem: 'Nota removida com sucesso.' });
  } catch (error) {
    console.error('Erro no DELETE /notas/:id:', error.message);
    res.status(500).json({ erro: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor a rodar na porta ${PORT}`));

module.exports = app;