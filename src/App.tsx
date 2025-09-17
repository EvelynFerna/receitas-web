import './App.css'
import React, { useEffect, useState } from 'react'
import axios from 'axios'

type Receita = {
  id: number;
  nome: string;
  ingredientes: string[];
  modoFazer: string;
  img: string;
  tipo: string;
  custoAproximado: number;
};

const API_URL = 'https://receitasapi-b-2025.vercel.app/receitas';

export default function App() {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [modalReceita, setModalReceita] = useState<Receita | null>(null);
  const [isEditModal, setIsEditModal] = useState(false);

  const [novonome, setNovonome] = useState('');
  const [novosIngredientes, setNovosIngredientes] = useState<string[]>(['']);
  const [novomodoFazer, setNovomodoFazer] = useState('');
  const [novoTipo, setNovoTipo] = useState('');
  const [novaImg, setNovaImg] = useState('');
  const [custoAproximado, setCustoAproximado] = useState<number | ''>('');

  // READ -> busca todas as receitas na API
  useEffect(() => {
    let mounted = true;
    const fetchReceitas = async () => {
      try {
        const res = await axios.get(API_URL);
        const data = res.data || [];
        const receitasFormatadas: Receita[] = data.map((r: any) => ({
          id: Number(r.id),
          nome: r.nome,
          ingredientes: Array.isArray(r.ingredientes)
            ? r.ingredientes
            : String(r.ingredientes).split(',').map((i: string) => i.trim()),
          modoFazer: r.modoFazer,
          img: r.img,
          tipo: r.tipo,
          custoAproximado: Number(r.custoAproximado ?? 0),
        }));
        if (mounted) setReceitas(receitasFormatadas);
      } catch (err) {
        console.error('Erro ao buscar receitas:', err);
      }
    };

    fetchReceitas();
    return () => {
      mounted = false;
    };
  }, []);

  // CREATE
  const cadastrarReceita = async (novaReceita: Omit<Receita, 'id'>) => {
    try {
      const payload = {
        ...novaReceita,
        ingredientes: Array.isArray(novaReceita.ingredientes)
          ? novaReceita.ingredientes.join(', ')
          : novaReceita.ingredientes,
      };

      const response = await axios.post(API_URL, payload);
      const created = response.data;

      const formatted: Receita = {
        id: Number(created.id ?? Date.now()),
        nome: created.nome ?? payload.nome,
        ingredientes: typeof created.ingredientes === 'string'
          ? created.ingredientes.split(',').map((i: string) => i.trim())
          : (created.ingredientes ?? payload.ingredientes).split
            ? (created.ingredientes ?? payload.ingredientes).split(',').map((s: string) => s.trim())
            : [],
        modoFazer: created.modoFazer ?? payload.modoFazer,
        img: created.img ?? payload.img,
        tipo: created.tipo ?? payload.tipo,
        custoAproximado: Number(created.custoAproximado ?? payload.custoAproximado ?? 0),
      };

      setReceitas((prev) => [...prev, formatted]);
    } catch (err) {
      console.error('Erro ao cadastrar receita:', err);
    }
  };

  // DELETE
  const excluirReceita = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setReceitas((prev) => prev.filter((r) => r.id !== id));
      if (modalReceita?.id === id) closeModal();
    } catch (err) {
      console.error('Erro ao excluir receita:', err);
    }
  };

  const editarReceita = (id: number) => {
    const receita = receitas.find((r) => r.id === id) ?? null;
    setModalReceita(receita);
    setNovonome(receita?.nome ?? '');
    setNovosIngredientes(receita?.ingredientes ?? ['']);
    setNovomodoFazer(receita?.modoFazer ?? '');
    setNovoTipo(receita?.tipo ?? '');
    setNovaImg(receita?.img ?? '');
    setCustoAproximado(receita?.custoAproximado ?? '');
    setIsEditModal(true);
  };


  const salvarReceitaEditada = async () => {
    if (!modalReceita) return;

    try {
      const payload = {
        nome: novonome,
        ingredientes: Array.isArray(novosIngredientes)
          ? novosIngredientes.join(', ')
          : novosIngredientes,
        modoFazer: novomodoFazer,
        img: novaImg,
        tipo: novoTipo,
        custoAproximado: Number(custoAproximado),
      };

      await axios.put(`${API_URL}/${modalReceita.id}`, payload);

      const ingredientesArray = Array.isArray(novosIngredientes)
        ? novosIngredientes
        : String(payload.ingredientes).split(',').map((i: string) => i.trim());

      const updatedReceita: Receita = {
        id: modalReceita.id,
        nome: payload.nome,
        ingredientes: ingredientesArray,
        modoFazer: payload.modoFazer,
        img: payload.img,
        tipo: payload.tipo,
        custoAproximado: Number(payload.custoAproximado),
      };

      setReceitas((prev) => prev.map((r) => (r.id === updatedReceita.id ? updatedReceita : r)));
      setIsEditModal(false);
      setModalReceita(null);
    } catch (err) {
      console.error('Erro ao salvar receita editada:', err);
    }
  };

  const closeModal = () => {
    setModalReceita(null);
    setIsEditModal(false);
  };

  return (
    <>
      <header>
        <h1>Livro de Receitas</h1>
      </header>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await cadastrarReceita({
            nome: novonome,
            ingredientes: novosIngredientes,
            modoFazer: novomodoFazer,
            img: novaImg,
            tipo: novoTipo,
            custoAproximado: Number(custoAproximado),
          });

          setNovonome('');
          setNovosIngredientes(['']);
          setNovomodoFazer('');
          setNovoTipo('');
          setNovaImg('');
          setCustoAproximado('');
        }}
        style={{ marginBottom: '2rem' }}
      >
        <h2>Cadastrar Nova Receita</h2>
        <input
          type="text"
          placeholder="Nome da receita"
          value={novonome}
          onChange={(e) => setNovonome(e.target.value)}
          required
        />
        <textarea
          placeholder="Modo de preparo"
          value={novomodoFazer}
          onChange={(e) => setNovomodoFazer(e.target.value)}
          required
        />

        <h3>Ingredientes:</h3>
        {novosIngredientes.map((ingrediente, idx) => (
          <input
            key={idx}
            type="text"
            placeholder={`Ingrediente ${idx + 1}`}
            value={ingrediente}
            onChange={(e) => {
              const newIngredientes = [...novosIngredientes];
              newIngredientes[idx] = e.target.value;
              setNovosIngredientes(newIngredientes);
            }}
            required
          />
        ))}

        <button type="button" onClick={() => setNovosIngredientes((prev) => [...prev, ''])}>
          Adicionar Ingrediente
        </button>

        <select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)} required>
          <option value="">Selecione o tipo</option>
          <option value="DOCE">Doce</option>
          <option value="SALGADA">Salgada</option>
        </select>

        <input
          type="text"
          placeholder="URL da imagem"
          value={novaImg}
          onChange={(e) => setNovaImg(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Custo aproximado"
          value={custoAproximado === '' ? '' : custoAproximado}
          onChange={(e) => setCustoAproximado(e.target.value === '' ? '' : Number(e.target.value))}
          required
          min={0}
          step="0.01"
        />

        <button type="submit">Cadastrar</button>
      </form>

      <main>
        {receitas.map((receita) => (
          <div key={receita.id} className="card">
            <h2>{receita.nome}</h2>
            <img src={receita.img} alt={receita.nome} />
            <p>
              <strong>Tipo:</strong> {receita.tipo}
            </p>
            <p>
              <strong>Custo aproximado:</strong> R$ {receita.custoAproximado}
            </p>
            <button onClick={() => setModalReceita(receita)}>Ver Receita</button>
            <button onClick={() => editarReceita(receita.id)}>Editar</button>
            <button onClick={() => excluirReceita(receita.id)}>Excluir</button>
          </div>
        ))}
      </main>

      <footer>
        <h2>By EvelynFerna</h2>
      </footer>

      {modalReceita && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{isEditModal ? 'Editar Receita' : 'Ver Receita'}</h2>

            {isEditModal ? (
              <>
                <input type="text" value={novonome} onChange={(e) => setNovonome(e.target.value)} />
                <textarea value={novomodoFazer} onChange={(e) => setNovomodoFazer(e.target.value)} />

                <h3>Ingredientes:</h3>
                {novosIngredientes.map((ingrediente, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={ingrediente}
                    onChange={(e) => {
                      const newIngredientes = [...novosIngredientes];
                      newIngredientes[idx] = e.target.value;
                      setNovosIngredientes(newIngredientes);
                    }}
                  />
                ))}

                <button type="button" onClick={() => setNovosIngredientes((prev) => [...prev, ''])}>
                  Adicionar Ingrediente
                </button>

                <select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)} required>
                  <option value="">Selecione o tipo</option>
                  <option value="DOCE">Doce</option>
                  <option value="SALGADA">Salgada</option>
                </select>

                <input type="text" value={novaImg} onChange={(e) => setNovaImg(e.target.value)} placeholder="URL da imagem" />

                <input
                  type="number"
                  value={custoAproximado === '' ? '' : custoAproximado}
                  onChange={(e) => setCustoAproximado(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Custo aproximado"
                  min={0}
                  step="0.01"
                />

                <button onClick={salvarReceitaEditada}>Salvar</button>
              </>
            ) : (
              <>
                <h3>Ingredientes:</h3>
                <ul>
                  {modalReceita.ingredientes.map((ingrediente, idx) => (
                    <li key={idx}>{ingrediente}</li>
                  ))}
                </ul>
                <h3>Modo de Preparo:</h3>
                <p>{modalReceita.modoFazer}</p>
                <p>
                  <strong>Tipo:</strong> {modalReceita.tipo}
                </p>
                <p>
                  <strong>Custo aproximado:</strong> R$ {modalReceita.custoAproximado}
                </p>
                <img src={modalReceita.img} alt={modalReceita.nome} style={{ maxWidth: '100%' }} />
              </>
            )}

            <button onClick={closeModal}>Fechar</button>
          </div>
        </div>
      )}
    </>
  );
}
