import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

const { createElement: e } = React;

function ResetSenha() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [token, setToken] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmacao, setConfirmacao] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const t = searchParams.get('token') || '';
        setToken(t);
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!token) {
            setError('Token inválido ou ausente.');
            return;
        }
        if (!novaSenha || novaSenha.length < 8) {
            setError('A nova senha deve ter pelo menos 8 caracteres.');
            return;
        }
        if (novaSenha !== confirmacao) {
            setError('As senhas não coincidem.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/login/redefinir-senha', { token, novaSenha });
            setSuccess(true);
            setTimeout(() => navigate('/'), 1800);
        } catch (err) {
            console.error('Erro ao redefinir senha:', err);
            if (err && err.status === 400) {
                setError('Token inválido/expirado ou senha fraca.');
            } else {
                setError('Falha ao redefinir senha. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return e('div', { className: 'reset-senha-container', style: { maxWidth: 420, margin: '40px auto', padding: 16 } }, [
        e('h2', { key: 'title' }, 'Redefinir Senha'),
        success
            ? e('div', { key: 'ok', style: { color: 'green', marginTop: 12 } }, 'Senha redefinida com sucesso! Redirecionando...')
            : e('form', { key: 'form', onSubmit: handleSubmit }, [
                e('div', { key: 'senha', style: { marginBottom: 12 } }, [
                    e('label', { htmlFor: 'novaSenha' }, 'Nova senha'),
                    e('input', {
                        id: 'novaSenha',
                        type: 'password',
                        value: novaSenha,
                        onChange: (ev) => setNovaSenha(ev.target.value),
                        required: true,
                        minLength: 8,
                        style: { width: '100%', padding: 8 }
                    })
                ]),
                e('div', { key: 'confirm', style: { marginBottom: 12 } }, [
                    e('label', { htmlFor: 'confirmacao' }, 'Confirmar nova senha'),
                    e('input', {
                        id: 'confirmacao',
                        type: 'password',
                        value: confirmacao,
                        onChange: (ev) => setConfirmacao(ev.target.value),
                        required: true,
                        minLength: 8,
                        style: { width: '100%', padding: 8 }
                    })
                ]),
                error && e('div', { key: 'err', style: { color: 'red', margin: '8px 0' } }, error),
                e('button', { key: 'submit', type: 'submit', disabled: loading, style: { width: '100%', padding: 10 } }, loading ? 'Redefinindo...' : 'Redefinir senha')
            ])
    ]);
}

export default ResetSenha;


