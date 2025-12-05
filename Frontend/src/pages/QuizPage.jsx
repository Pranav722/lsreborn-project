import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';
import { BrainCircuit, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

const QuizPage = ({ user, setPage }) => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null); // { passed: boolean, score: number, total: number, message: string }

    const isAdmin = user && (user.isAdmin || user.isStaff);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/forms/quiz`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) {
                    if (res.status === 403) {
                        if (data.status === 'cooldown') {
                            setResult({ status: 'cooldown', message: "You are currently on cooldown.", expiry: data.expiry });
                        } else if (data.status === 'pending') {
                            setResult({ status: 'pending', message: "Your application is pending approval." });
                        } else {
                            setResult({ status: 'error', message: data.message || "Access Denied" });
                        }
                    } else {
                        alert(data.message || "Error loading quiz");
                        setPage('home');
                    }
                    return null;
                }
                return data;
            })
            .then(data => {
                if (data) {
                    setQuestions(data);
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleAnswer = (option) => {
        setAnswers({ ...answers, [questions[currentQuestion].question]: option });
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(curr => curr + 1);
        } else {
            submitQuiz();
        }
    };

    const submitQuiz = async () => {
        setSubmitting(true);
        const formattedAnswers = Object.entries(answers).map(([q, a]) => ({ question: q, answer: a }));

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/forms/submit/whitelist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ answers: formattedAnswers })
            });
            const data = await res.json();

            setResult({
                passed: data.passed,
                score: data.score,
                total: data.total,
                message: data.message,
                status: data.passed ? 'approved' : 'rejected'
            });

        } catch (e) {
            console.error(e);
            alert("Submission error. Please contact staff.");
        }
        setSubmitting(false);
    };

    if (loading) return <div className="text-center text-cyan-400 pt-20 animate-pulse">Loading Examination...</div>;

    // --- RESULTS SCREEN ---
    if (result) {
        const isApproved = result.status === 'approved' || result.passed;
        const isRejected = result.status === 'rejected' || (result.passed === false && result.status !== 'cooldown');
        const isPending = result.status === 'pending';
        const isCooldown = result.status === 'cooldown';
        const isError = result.status === 'error';

        let borderColor = 'border-gray-500';
        let icon = <AlertTriangle className="w-24 h-24 text-gray-400" />;
        let title = "Application Status";
        let titleColor = "text-white";

        if (isApproved) {
            borderColor = 'border-green-500';
            icon = <CheckCircle className="w-24 h-24 text-green-400 animate-bounce" />;
            title = "Application Approved";
            titleColor = "text-green-300";
        } else if (isRejected) {
            borderColor = 'border-red-500';
            icon = <XCircle className="w-24 h-24 text-red-400 animate-pulse" />;
            title = "Application Rejected";
            titleColor = "text-red-300";
        } else if (isPending) {
            borderColor = 'border-yellow-500';
            icon = <Clock className="w-24 h-24 text-yellow-400 animate-pulse" />;
            title = "Waiting for Approval";
            titleColor = "text-yellow-300";
        } else if (isCooldown) {
            borderColor = 'border-orange-500';
            icon = <Clock className="w-24 h-24 text-orange-400" />;
            title = "Application Cooldown";
            titleColor = "text-orange-300";
        }

        return (
            <div className="max-w-2xl mx-auto pt-10 animate-fade-in">
                <Card className={`border-l-4 ${borderColor}`}>
                    <div className="text-center space-y-6 py-8">
                        <div className="flex justify-center">
                            {icon}
                        </div>

                        <div>
                            <h2 className="text-4xl font-bold text-white mb-2">
                                {title}
                            </h2>
                            {(isApproved || isRejected) && result.total > 0 && (
                                <p className={`text-xl font-medium ${titleColor}`}>
                                    Score: {result.score} / {result.total}
                                </p>
                            )}
                        </div>

                        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 text-left max-w-lg mx-auto">
                            <h4 className="text-gray-400 text-sm uppercase tracking-wider font-bold mb-3">
                                {isApproved ? "Next Steps" : "Status Detail"}
                            </h4>
                            <p className="text-gray-300 leading-relaxed">
                                {result.message}
                            </p>
                            {isCooldown && result.expiry && (
                                <div className="mt-4 text-sm text-orange-400">
                                    You can re-apply after: {new Date(result.expiry).toLocaleString()}
                                </div>
                            )}
                            {isRejected && !isCooldown && (
                                <div className="mt-4 flex items-center gap-3 text-yellow-400 text-sm bg-yellow-400/10 p-3 rounded-lg border border-yellow-400/20">
                                    <AlertTriangle size={18} />
                                    <span>You can re-apply in 24 hours. Please review the server rules.</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center gap-4 pt-4">
                            <AnimatedButton onClick={() => setPage('home')} className="bg-gray-700">
                                Return Home
                            </AnimatedButton>
                            {isAdmin && (
                                <AnimatedButton onClick={() => window.location.reload()} className="bg-purple-600">
                                    Admin Retake
                                </AnimatedButton>
                            )}
                            {isApproved && (
                                <AnimatedButton onClick={() => setPage('queue')} className="bg-green-600">
                                    Connect to Server
                                </AnimatedButton>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // --- QUIZ QUESTION UI ---
    const q = questions[currentQuestion];

    return (
        <div className="max-w-3xl mx-auto pt-10 animate-slide-in-up">
            <Card>
                <div className="flex items-center gap-4 mb-6 border-b border-cyan-500/30 pb-4">
                    <BrainCircuit className="text-cyan-400 w-8 h-8" />
                    <div>
                        <h2 className="text-2xl font-bold text-white">Roleplay Competency Exam</h2>
                        {isAdmin && <span className="text-xs text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded">Admin Test Mode</span>}
                    </div>
                    <span className="ml-auto text-gray-400 font-mono">Q{currentQuestion + 1} / {questions.length}</span>
                </div>

                <div className="mb-8 min-h-[200px]">
                    <h3 className="text-xl text-white mb-6 font-medium leading-relaxed">{q.question}</h3>
                    <div className="space-y-3">
                        {q.options.map((opt, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleAnswer(opt)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 flex items-center gap-3 group ${answers[q.question] === opt
                                        ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)] transform scale-[1.02]'
                                        : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${answers[q.question] === opt ? 'border-cyan-400 bg-cyan-400' : 'border-gray-500'}`}>
                                    {answers[q.question] === opt && <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />}
                                </div>
                                {opt}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between items-center border-t border-gray-800 pt-6">
                    <div className="w-full bg-gray-800 h-1.5 rounded-full max-w-[200px] overflow-hidden">
                        <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}></div>
                    </div>
                    <AnimatedButton
                        onClick={handleNext}
                        disabled={!answers[q.question] || submitting}
                        className="bg-cyan-600 min-w-[140px]"
                    >
                        {currentQuestion === questions.length - 1 ? (submitting ? "Grading..." : "Submit Exam") : "Next Question"}
                    </AnimatedButton>
                </div>
            </Card>
        </div>
    );
};

export default QuizPage;