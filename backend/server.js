const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017';

if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined. Please set it in your environment variables.");
    process.exit(1); // Encerra a aplicação se o segredo não estiver definido
}

// Middleware para processar JSON
app.use(express.json());

// Variáveis para o cliente do DB e coleções
let db;
let usersCollection;
let hoursCollection;
let leaveRequestsCollection;
let settingsCollection;

// --- Middleware de Autenticação ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

async function isAdmin(req, res, next) {
    const user = await usersCollection.findOne({ username: req.user.username });
    if (user && user.isAdmin) {
        next();
    } else {
        res.sendStatus(403); // Forbidden
    }
}

// --- Endpoints de Autenticação ---

app.post('/api/auth/register', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: "Usuário e senha são obrigatórios." }); 
        
        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Usuário já existe." });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        await usersCollection.insertOne({ username, passwordHash, isAdmin: false });
        console.log('Novo usuário registrado:', username);
        res.status(201).json({ message: "Usuário registrado com sucesso." }); 
    } catch (err) {
        next(err); // Passa o erro para o middleware central
    }
});

app.post('/api/auth/login', async (req, res, next) => {
    const { username, password } = req.body;
    const user = await usersCollection.findOne({ username });
    if (user == null) {
        return res.status(400).json({ error: "Usuário não encontrado." });
    }
    try {
        if (await bcrypt.compare(password, user.passwordHash)) {
            const payload = { 
                username: user.username, 
                userId: user._id // Adicionando o ID do usuário ao payload do token
            };
            const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
            res.json({ accessToken: accessToken, isAdmin: !!user.isAdmin, userId: user._id });
        } else {
            res.status(401).json({ error: "Senha incorreta." });
        }
    } catch (err) {
        next(err); // Passa o erro para o middleware central
    }
});

// --- Endpoints de Dados (Agora Protegidos) ---

app.get('/api/hours/:date', authenticateToken, async (req, res) => {
    const { username } = req.user;
    const { date } = req.params;
    const record = await hoursCollection.findOne({ username, date });
    res.json({ date, totalMinutes: record?.totalMinutes || 0 });
});

app.post('/api/hours/:date', authenticateToken, async (req, res) => {
    const { username } = req.user;
    const { date } = req.params;
    const { totalMinutes } = req.body;

    if (typeof totalMinutes !== 'number') return res.status(400).json({ error: 'totalMinutes must be a number.' });

    await hoursCollection.updateOne(
        { username, date },
        { $set: { username, date, totalMinutes } },
        { upsert: true } // Cria o documento se ele não existir
    ); 
    console.log(`Dados de ${username} para a data ${date} atualizados.`);
    res.status(200).json({ message: 'Data saved successfully.' });
});

app.get('/api/week-data/:baseDate', authenticateToken, async (req, res) => {
    const { username } = req.user;
    const { baseDate } = req.params;
    const weekHours = [0, 0, 0, 0, 0, 0, 0]; // Dom a Sáb

    const date = new Date(baseDate + 'T12:00:00Z');
    const dayOfWeek = date.getUTCDay();
    const sunday = new Date(date);
    sunday.setUTCDate(date.getUTCDate() - dayOfWeek);

    const weekDates = []; 
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(sunday);
        currentDate.setUTCDate(sunday.getUTCDate() + i);
        weekDates.push(currentDate.toISOString().split('T')[0]);
    }

    const weekRecords = await hoursCollection.find({ username, date: { $in: weekDates } }).toArray();
    const recordsMap = new Map(weekRecords.map(r => [r.date, r.totalMinutes])); 

    for (let i = 0; i < 7; i++) {
        weekHours[i] = (recordsMap.get(weekDates[i]) || 0) / 60;
    }

    res.json({ hours: weekHours });
});

app.get('/api/month-summary/:year/:month', authenticateToken, async (req, res) => {
    const { username } = req.user;
    const { year, month } = req.params;
    const monthRegex = new RegExp(`^${year}-${month.padStart(2, '0')}-\\d{2}`); 

    const result = await hoursCollection.aggregate([
        { $match: { username, date: { $regex: monthRegex } } },
        { $group: { _id: null, total: { $sum: "$totalMinutes" } } }
    ]).toArray(); 

    res.json({ totalMonthMinutes: result[0]?.total || 0 });
});

app.get('/api/export/month/:year/:month', authenticateToken, async (req, res) => {
    const { username } = req.user;
    const { year, month } = req.params;
    const monthRegex = new RegExp(`^${year}-${month.padStart(2, '0')}-\\d{2}`); 

    const monthRecords = await hoursCollection.find({ username, date: { $regex: monthRegex } }).sort({ date: 1 }).toArray();

    let csvContent = "data,horas_trabalhadas\n";
    monthRecords.forEach(record => {
        const hours = Math.floor(record.totalMinutes / 60);
        const mins = record.totalMinutes % 60;
        csvContent += `${record.date},"${hours}h ${mins}m"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`relatorio_horas_${username}_${year}-${month}.csv`);
    res.send(csvContent); 
});


// --- Endpoints de Pedido de Folga ---

app.get('/api/leave-requests', authenticateToken, async (req, res) => { 
    const requests = await leaveRequestsCollection.find({ username: req.user.username }).sort({ date: -1 }).toArray();
    res.json(requests);
});

app.post('/api/leave-requests', authenticateToken, async (req, res) => {
    const { date, reason } = req.body;
    const { username } = req.user;

    const config = await settingsCollection.findOne({ _id: 'config' });
    const limit = config?.monthlyLeaveLimit || 1; 
    const [year, month] = date.split('-');
    const monthRegex = new RegExp(`^${year}-${month}-\\d{2}`);
    const userRequestsThisMonth = await leaveRequestsCollection.countDocuments({ username, date: { $regex: monthRegex } });

    if (userRequestsThisMonth >= limit) {
        return res.status(400).json({ error: `Limite mensal de ${limit} pedido(s) de folga atingido.` });
    }

    const newRequest = { username, date, reason, status: 'pending', createdAt: new Date() };
    await leaveRequestsCollection.insertOne(newRequest); 
    res.status(201).json(newRequest);
});

// --- Endpoints de Administrador ---

app.get('/api/admin/leave-requests', authenticateToken, isAdmin, async (req, res) => {
    const allRequests = await leaveRequestsCollection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(allRequests);
});

app.put('/api/admin/leave-requests/:id/status', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['approved', 'denied'].includes(status)) return res.status(400).json({ error: 'Status inválido.' });
    
    const result = await leaveRequestsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status } });
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Pedido não encontrado.' });
    res.status(200).json({ message: 'Status do pedido atualizado.' });
});

app.delete('/api/admin/leave-requests/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const result = await leaveRequestsCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Pedido não encontrado.' });
    res.status(200).json({ message: 'Pedido de folga excluído.' }); 
});

app.post('/api/admin/settings/leave-limit', authenticateToken, isAdmin, async (req, res) => {
    const { limit } = req.body;
    if (typeof limit !== 'number' || limit < 0) return res.status(400).json({ error: 'Limite inválido.' });
    
    await settingsCollection.updateOne({ _id: 'config' }, { $set: { monthlyLeaveLimit: limit } }, { upsert: true });
    res.status(200).json({ message: `Limite de folgas mensais definido para ${limit}.` }); 
});

// --- NOVOS ENDPOINTS DE GERENCIAMENTO DE USUÁRIOS ---

// Listar todos os usuários (sem a hash da senha)
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await usersCollection.find({}, { projection: { passwordHash: 0 } }).toArray();
        res.json(users);
    } catch (err) {
        console.error("Erro ao buscar usuários:", err);
        res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
});

// Atualizar um usuário (username ou senha)
app.put('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { username, newPassword } = req.body;
    
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID de usuário inválido.' });
    }

    const updateData = {};

    try {
        // Se um novo username foi fornecido, verifica se já não está em uso por outro usuário
        if (username) {
            const existingUser = await usersCollection.findOne({ username: username, _id: { $ne: new ObjectId(id) } });
            if (existingUser) {
                return res.status(400).json({ error: 'Este nome de usuário já está em uso.' });
            }
            updateData.username = username;
        }

        // Se uma nova senha foi fornecida, cria o hash dela
        if (newPassword) {
            if (newPassword.length < 4) { // Validação simples de tamanho
                return res.status(400).json({ error: 'A nova senha deve ter pelo menos 4 caracteres.' });
            }
            updateData.passwordHash = await bcrypt.hash(newPassword, 10);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'Nenhum dado para atualizar foi fornecido.' });
        }

        const result = await usersCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
        if (result.matchedCount === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
        res.status(200).json({ message: 'Usuário atualizado com sucesso.' });
    } catch (err) {
        console.error("Erro ao atualizar usuário:", err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// --- Middleware de Tratamento de Erros Centralizado ---
// Deve ser o último 'app.use'
app.use((err, req, res, next) => {
    console.error(err.stack); // Loga o erro completo no console do servidor
    res.status(500).json({ 
        error: "Ocorreu um erro interno no servidor. Por favor, tente novamente mais tarde." 
    });
});


async function startServer() { 
    const client = new MongoClient(DATABASE_URL);
    await client.connect();
    console.log('Conectado ao MongoDB com sucesso!');
    db = client.db();
    usersCollection = db.collection('users');
    hoursCollection = db.collection('hours');
    leaveRequestsCollection = db.collection('leave_requests');
    settingsCollection = db.collection('settings');
    await settingsCollection.updateOne({ _id: 'config' }, { $setOnInsert: { monthlyLeaveLimit: 2 } }, { upsert: true }); 

    app.listen(PORT, () => {
        console.log(`Backend server running on port ${PORT}`);
    });
}

startServer().catch(console.error);