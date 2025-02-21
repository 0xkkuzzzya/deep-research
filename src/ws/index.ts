import WebSocket, { WebSocketServer } from 'ws';

enum MessageType {
    QUESTION = 'question',
    ANSWER = 'answer',
    REPORT = 'report',
    ERROR = 'error'
}

interface WsMessage {
    type: MessageType;
    data: string;
    questionId?: number;
}

interface ClientSession {
    ws: WebSocket;
    currentQuestion: number;
    answers: string[];
    isReportProcessing: boolean;
}

const wss = new WebSocketServer({ port: 8080 });
const sessions = new Map<string, ClientSession>();

wss.on('connection', (ws: WebSocket) => {
    const sessionId = generateSessionId();

    const session: ClientSession = {
        ws,
        currentQuestion: 0,
        answers: [],
        isReportProcessing: false
    };

    sessions.set(sessionId, session);

    // Отправляем первый вопрос сразу после подключения
    sendQuestion(sessionId, 1);

    ws.on('message', (data: string) => {
        try {
            const message: WsMessage = JSON.parse(data);
            handleClientMessage(sessionId, message);
        } catch (error) {
            sendError(sessionId, 'Invalid message format');
        }
    });

    ws.on('close', () => {
        sessions.delete(sessionId);
    });
});

function generateSessionId(): string {
    return Math.random().toString(36).substr(2, 9);
}

async function sendQuestion(sessionId: string, questionNumber: number) {
    const session = sessions.get(sessionId);
    if (!session) return;

    session.currentQuestion = questionNumber;

    const questionMessage: WsMessage = {
        type: MessageType.QUESTION,
        data: `Уточняющий вопрос #${questionNumber}`,
        questionId: questionNumber
    };

    session.ws.send(JSON.stringify(questionMessage));
}

async function handleClientMessage(sessionId: string, message: WsMessage) {
    const session = sessions.get(sessionId);
    if (!session) return;

    if (message.type === MessageType.ANSWER) {
        if (session.isReportProcessing) {
            sendError(sessionId, 'Report is already processing');
            return;
        }

        session.answers.push(message.data);

        if (session.currentQuestion < 3) {
            // Отправляем следующий вопрос
            sendQuestion(sessionId, session.currentQuestion + 1);
        } else {
            // Запускаем обработку отчета
            session.isReportProcessing = true;
            startReportGeneration(sessionId);
        }
    }
}

async function startReportGeneration(sessionId: string) {
    const session = sessions.get(sessionId);
    if (!session) return;

    // Эмуляция долгого процесса генерации отчета
    setTimeout(() => {
        const report = `Отчет на основе ответов: ${session.answers.join(', ')}`;
        sendReport(sessionId, report);
    }, 300000);
}

function sendReport(sessionId: string, report: string) {
    const session = sessions.get(sessionId);
    if (!session) return;

    const reportMessage: WsMessage = {
        type: MessageType.REPORT,
        data: report
    };

    session.ws.send(JSON.stringify(reportMessage));
    session.ws.close(); // Закрываем соединение после отправки
}

function sendError(sessionId: string, error: string) {
    const session = sessions.get(sessionId);
    if (!session) return;

    const errorMessage: WsMessage = {
        type: MessageType.ERROR,
        data: error
    };

    session.ws.send(JSON.stringify(errorMessage));
}