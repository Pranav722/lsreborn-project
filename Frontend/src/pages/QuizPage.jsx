import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';
import { BrainCircuit } from 'lucide-react';

const QuizPage = ({ user, setPage }) => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/forms/quiz`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        })
        .then(res => res.json())
        .then(data => {
            setQuestions(data);
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
            if (res.ok) {
                alert(data.message);
                setPage('home');
            } else {
                alert("Failed: " + data.message);
                setPage('home'); // Kick back to home on fail to prevent retry spam
            }
        } catch (e) {
            console.error(e);
        }
        setSubmitting(false);
    };

    if (loading) return <div className="text-center text-cyan-400 pt-20">Loading Examination...</div>;

    const q = questions[currentQuestion];

    return (
        <div className="max-w-3xl mx-auto pt-10">
            <Card>
                <div className="flex items-center gap-4 mb-6 border-b border-cyan-500/30 pb-4">
                    <BrainCircuit className="text-cyan-400 w-8 h-8" />
                    <h2 className="text-2xl font-bold text-white">Roleplay Competency Exam</h2>
                    <span className="ml-auto text-gray-400">Question {currentQuestion + 1} / {questions.length}</span>
                </div>
                
                <div className="mb-8">
                    <h3 className="text-xl text-white mb-6">{q.question}</h3>
                    <div className="space-y-3">
                        {q.options.map((opt, idx) => (
                            <div 
                                key={idx}
                                onClick={() => handleAnswer(opt)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                                    answers[q.question] === opt 
                                    ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                                    : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                                {opt}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <AnimatedButton 
                        onClick={handleNext} 
                        disabled={!answers[q.question] || submitting}
                        className="bg-cyan-600"
                    >
                        {currentQuestion === questions.length - 1 ? (submitting ? "Grading..." : "Submit Exam") : "Next Question"}
                    </AnimatedButton>
                </div>
            </Card>
        </div>
    );
};

export default QuizPage;