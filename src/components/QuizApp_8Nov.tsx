'use client'

import { useState, useEffect, useRef } from 'react'

export default function QuizApp() {
    // State declarations
    const [topics, setTopics] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedTopics = localStorage.getItem('teachme-topics')
            return savedTopics ? JSON.parse(savedTopics) : {}
        }
        return {}
    })
    const [currentTopic, setCurrentTopic] = useState('')
    const [newTopic, setNewTopic] = useState('')
    const [question, setQuestion] = useState('')
    const [questionImage, setQuestionImage] = useState('')
    const [answer, setAnswer] = useState('')
    const [answerImage, setAnswerImage] = useState('')
    const [userAnswer, setUserAnswer] = useState('')
    const [currentQuestion, setCurrentQuestion] = useState(null)
    const [showAnswer, setShowAnswer] = useState(false)
    const [shownAnswers, setShownAnswers] = useState<{[key: string]: boolean}>({})
    const [expandedTopic, setExpandedTopic] = useState('')
    const [dragActive, setDragActive] = useState(false)
    
    // Refs
    const questionInputFileRef = useRef(null)
    const answerInputFileRef = useRef(null)

    // Effects
    useEffect(() => {
        localStorage.setItem('teachme-topics', JSON.stringify(topics))
    }, [topics])

    // Helper functions
    const convertToBase64 = (file: File) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result)
            reader.onerror = (error) => reject(error)
        })
    }

    // Event handlers
    const handleFile = async (file: File, setImage: (base64: string) => void) => {
        if (file && (file.type.startsWith('image/jpeg') || file.type.startsWith('image/png'))) {
            try {
                const base64 = await convertToBase64(file)
                setImage(base64 as string)
            } catch (error) {
                alert('Error processing image. Please try again.')
            }
        } else {
            alert('Please upload a valid image file (JPEG or PNG)')
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = async (e: React.DragEvent, setImage: (base64: string) => void) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handleFile(e.dataTransfer.files[0], setImage)
        }
    }

    // Action handlers
    const clearAllData = () => {
        if (confirm('Are you sure you want to delete all topics and questions?')) {
            setTopics({})
            localStorage.removeItem('teachme-topics')
            setCurrentTopic('')
            setExpandedTopic('')
        }
    }

    const addTopic = () => {
        if (newTopic.trim()) {
            setTopics(prev => ({
                ...prev,
                [newTopic]: []
            }))
            setNewTopic('')
        }
    }

    const addQuestion = () => {
        if (currentTopic && question.trim() && (answer.trim() || answerImage)) {
            setTopics(prev => ({
                ...prev,
                [currentTopic]: [...prev[currentTopic], { 
                    question: question.trim(),
                    questionImage,
                    answer: answer.trim(),
                    answerImage 
                }]
            }))
            setQuestion('')
            setQuestionImage('')
            setAnswer('')
            setAnswerImage('')
        }
    }

    const deleteTopic = (topic: string) => {
        if (confirm(`Are you sure you want to delete "${topic}" and all its questions?`)) {
            const newTopics = { ...topics }
            delete newTopics[topic]
            setTopics(newTopics)
            if (currentTopic === topic) setCurrentTopic('')
            if (expandedTopic === topic) setExpandedTopic('')
            
            const newShownAnswers = { ...shownAnswers }
            Object.keys(newShownAnswers).forEach(key => {
                if (key.startsWith(`${topic}-`)) {
                    delete newShownAnswers[key]
                }
            })
            setShownAnswers(newShownAnswers)
        }
    }
    
    const deleteQuestion = (topic: string, questionIndex: number) => {
        if (confirm('Are you sure you want to delete this question?')) {
            setTopics(prev => ({
                ...prev,
                [topic]: prev[topic].filter((_, index) => index !== questionIndex)
            }))
            
            const newShownAnswers = { ...shownAnswers }
            delete newShownAnswers[`${topic}-${questionIndex}`]
            setShownAnswers(newShownAnswers)
        }
    }

    const getRandomQuestion = () => {
        if (currentTopic && topics[currentTopic]?.length > 0) {
            const topicQuestions = topics[currentTopic]
            const randomIndex = Math.floor(Math.random() * topicQuestions.length)
            setCurrentQuestion(topicQuestions[randomIndex])
            setUserAnswer('')
            setShowAnswer(false)
        }
    }

    const checkAnswer = () => {
        if (currentQuestion) {
            setShowAnswer(true)
        }
    }

    // Render component
    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Practice Section */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-xl shadow-lg border border-blue-100">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-blue-800 mb-2">Practice Mode</h2>
                    <p className="text-gray-600">Test your knowledge and learn as you go!</p>
                </div>

                <div className="max-w-xl mx-auto space-y-6">
                    {/* Topic Selection */}
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Topic to Practice
                        </label>
                        <select
                            value={currentTopic}
                            onChange={(e) => {
                                setCurrentTopic(e.target.value)
                                setCurrentQuestion(null)
                                setShowAnswer(false)
                                setUserAnswer('')
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 
                                    focus:ring-blue-500 focus:border-blue-500 transition-all"
                        >
                            <option value="">Choose a topic...</option>
                            {Object.entries(topics).map(([topic, questions]) => (
                                <option key={topic} value={topic}>
                                    {topic} ({questions.length} questions)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Start Practice Button */}
                    {!currentQuestion && (
                        <button
                            onClick={getRandomQuestion}
                            disabled={!currentTopic || topics[currentTopic]?.length === 0}
                            className="w-full bg-blue-600 text-white p-4 rounded-lg font-medium
                                    hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                                    transition-all transform hover:scale-[1.02]"
                        >
                            {!currentTopic 
                                ? "Select a topic to start" 
                                : topics[currentTopic]?.length === 0 
                                    ? "Add questions to this topic first"
                                    : "Start Practice"}
                        </button>
                    )}

                    {/* Question Card */}
                    {currentQuestion && (
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            {/* Question Display */}
                            <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-blue-600 font-medium">
                                        Topic: {currentTopic}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        Question {topics[currentTopic].findIndex(q => 
                                            q.question === currentQuestion.question) + 1} of {topics[currentTopic].length}
                                    </span>
                                </div>
                                <p className="text-xl font-medium text-gray-800 mb-4">
                                    {currentQuestion.question}
                                </p>
                                {currentQuestion.questionImage && (
                                    <img 
                                        src={currentQuestion.questionImage}
                                        alt="Question visual"
                                        className="max-h-48 mx-auto rounded-lg"
                                    />
                                )}
                            </div>

                            {/* Answer Input */}
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Your Answer
                                    </label>
                                    <input
                                        type="text"
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                                        placeholder="Type your answer here..."
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 
                                                focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Submit Answer Button */}
                                {!showAnswer && (
                                    <button
                                        onClick={checkAnswer}
                                        className="w-full bg-green-600 text-white p-3 rounded-lg font-medium
                                                hover:bg-green-700 transition-all transform hover:scale-[1.02]"
                                    >
                                        Check Answer
                                    </button>
                                )}

                                {/* Answer Feedback */}
                                {showAnswer && (
                                    <div className="space-y-4">
                                        <div className={`p-4 rounded-lg ${
                                            userAnswer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim()
                                                ? 'bg-green-50 border border-green-200'
                                                : 'bg-red-50 border border-red-200'
                                        }`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                {userAnswer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim() 
                                                    ? <span className="text-green-600 text-lg">✓ Correct!</span>
                                                    : <span className="text-red-600 text-lg">× Not quite right</span>
                                                }
                                            </div>
                                            {currentQuestion.answer && (
                                                <p className="font-medium text-gray-800">
                                                    Correct Answer: {currentQuestion.answer}
                                                </p>
                                            )}
                                        </div>

                                        {currentQuestion.answerImage && (
                                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-600 mb-2">Visual Reference:</p>
                                                <img 
                                                    src={currentQuestion.answerImage}
                                                    alt="Answer visual"
                                                    className="max-h-48 mx-auto rounded-lg"
                                                />
                                            </div>
                                        )}

                                        {/* Next Question Button */}
                                        <button
                                            onClick={getRandomQuestion}
                                            className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium
                                                    hover:bg-blue-700 transition-all transform hover:scale-[1.02]
                                                    flex items-center justify-center gap-2"
                                        >
                                            <span>Next Question</span>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                    d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Topic Section */}
            <div className="bg-gradient-to-r from-white to-blue-50 p-8 rounded-xl shadow-lg border border-blue-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-blue-800">Create New Topic</h2>
                        <p className="text-gray-600 text-sm mt-1">Start by adding a topic for your questions</p>
                    </div>
                    <button
                        onClick={clearAllData}
                        className="text-red-500 hover:text-red-700 text-sm px-4 py-2 rounded-lg
                                hover:bg-red-50 transition-all duration-200"
                    >
                        Clear All Data
                    </button>
                </div>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        placeholder="Enter topic name (e.g., Mathematics, Science, History)"
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 
                                focus:ring-blue-500 focus:border-blue-500 transition-all
                                placeholder:text-gray-400 text-gray-600"
                    />
                    <button
                        onClick={addTopic}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700
                                transition-all duration-200 transform hover:scale-[1.02]
                                font-medium flex items-center gap-2"
                    >
                        <span>Add Topic</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Add Question Section */}
            <div className="bg-gradient-to-r from-white to-purple-50 p-8 rounded-xl shadow-lg border border-purple-100">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-purple-800">Add New Question</h2>
                    <p className="text-gray-600 text-sm mt-1">Create questions for your selected topic</p>
                </div>
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Topic</label>
                        <select
                            value={currentTopic}
                            onChange={(e) => setCurrentTopic(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 
                                    focus:ring-purple-500 focus:border-purple-500 transition-all"
                        >
                            <option value="">Choose a topic...</option>
                            {Object.keys(topics).map(topic => (
                                <option key={topic} value={topic}>{topic}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Type your question here"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 
                                    focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                    </div>

                    {/* Compact Question Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2"> </label>
                        <div className="flex gap-2 items-center">
                            <div 
                                className={`flex-1 border-2 border-dashed rounded-lg p-3 text-center transition-all duration-200
                                    ${dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={(e) => handleDrop(e, setQuestionImage)}
                            >
                                <input
                                    ref={questionInputFileRef}
                                    type="file"
                                    accept="image/jpeg, image/png"
                                    onChange={(e) => e.target.files && handleFile(e.target.files[0], setQuestionImage)}
                                    className="hidden"
                                />
                                
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => questionInputFileRef.current?.click()}
                                        className="bg-white hover:bg-gray-50 px-3 py-1.5 rounded border
                                                border-purple-200 hover:border-purple-300 transition-all duration-200
                                                text-purple-700 text-sm font-medium"
                                    >
                                        Choose Image
                                    </button>
                                    <span className="text-sm text-gray-500">or drag and drop</span>
                                </div>
                            </div>

                            {questionImage && (
                                <div className="relative w-24 h-24">
                                    <img
                                        src={questionImage}
                                        alt="Question preview"
                                        className="w-24 h-24 object-cover rounded-lg"
                                    />
                                    <button
                                        onClick={() => setQuestionImage('')}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1
                                                hover:bg-red-600 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Answer</label>
                        <input
                            type="text"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Type the answer here (optional if providing image)"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 
                                    focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                    </div>

                    {/* Answer Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Answer Image (Optional)</label>
                        <div 
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                                ${dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={(e) => handleDrop(e, setAnswerImage)}
                        >
                            <input
                                ref={answerInputFileRef}
                                type="file"
                                accept="image/jpeg, image/png"
                                onChange={(e) => e.target.files && handleFile(e.target.files[0], setAnswerImage)}
                                className="hidden"
                            />
                            
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => answerInputFileRef.current?.click()}
                                    className="bg-white hover:bg-gray-50 px-6 py-3 rounded-lg border-2
                                            border-purple-200 hover:border-purple-300 transition-all duration-200
                                            text-purple-700 font-medium"
                                >
                                    Choose Answer Image
                                </button>
                                <p className="text-sm text-gray-500">
                                    or drag and drop image here (JPEG, PNG)
                                </p>
                            </div>

                            {answerImage && (
                                <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
                                    <img
                                        src={answerImage}
                                        alt="Answer preview"
                                        className="max-h-48 mx-auto rounded-lg"
                                    />
                                    <button
                                        onClick={() => setAnswerImage('')}
                                        className="mt-3 text-red-500 hover:text-red-700 text-sm
                                                px-4 py-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                                    >
                                        Remove Image
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={addQuestion}
                        disabled={!currentTopic || (!answer.trim() && !answerImage)}
                        className="w-full bg-purple-600 text-white px-6 py-4 rounded-lg font-medium
                                hover:bg-purple-700 transition-all duration-200 transform hover:scale-[1.02]
                                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                                flex items-center justify-center gap-2"
                    >
                        <span>Add Question</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Topics Overview Section */}
            <div className="bg-gradient-to-r from-white to-green-50 p-8 rounded-xl shadow-lg border border-green-100">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-green-800">Your Question Bank</h2>
                    <p className="text-gray-600 text-sm mt-1">View and manage all your topics and questions</p>
                </div>
                
                <div className="space-y-4">
                    {Object.entries(topics).map(([topic, questions]) => (
                        <div key={topic} className="border border-gray-200 rounded-xl shadow-sm overflow-hidden
                                                transition-all duration-200 hover:shadow-md">
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-white to-green-50">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setExpandedTopic(expandedTopic === topic ? '' : topic)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full
                                                bg-white border border-gray-200 hover:bg-green-50 
                                                transition-all duration-200"
                                    >
                                        {expandedTopic === topic ? 
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                                            </svg> :
                                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                                            </svg>
                                        }
                                    </button>
                                    <div>
                                        <span className="font-medium text-lg">{topic}</span>
                                        <span className="ml-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                            {questions.length} {questions.length === 1 ? 'question' : 'questions'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteTopic(topic)}
                                    className="flex items-center gap-2 text-red-500 hover:text-red-700 px-4 py-2 
                                            rounded-lg hover:bg-red-50 transition-all duration-200"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                    <span className="text-sm font-medium">Delete Topic</span>
                                </button>
                            </div>

                            {expandedTopic === topic && (
                                <div className="divide-y divide-gray-100">
                                    {questions.length === 0 ? (
                                        <div className="p-8 text-center bg-gray-50">
                                            <p className="text-gray-500 italic">
                                                No questions added to this topic yet. 
                                                <br/>
                                                <span className="text-sm">Add some questions to get started!</span>
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {questions.map((q, index) => (
                                                <div key={index} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <p className="font-medium text-gray-800">
                                                                <span className="text-green-600 mr-2">Q{index + 1}:</span> 
                                                                {q.question}
                                                            </p>
                                                        </div>

                                                        {q.questionImage && (
                                                            <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                                                                <img 
                                                                    src={q.questionImage}
                                                                    alt="Question visual"
                                                                    className="max-h-32 rounded-lg mx-auto"
                                                                />
                                                            </div>
                                                        )}
                                                        
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => {
                                                                    const questionId = `${topic}-${index}`;
                                                                    setShownAnswers(prev => ({
                                                                        ...prev,
                                                                        [questionId]: !prev[questionId]
                                                                    }));
                                                                }}
                                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 
                                                                        px-3 py-1 rounded-lg hover:bg-blue-50 transition-all duration-200"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    {shownAnswers[`${topic}-${index}`] ? (
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                                                                    ) : (
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                                                    )}
                                                                </svg>
                                                                <span className="text-sm font-medium">
                                                                    {shownAnswers[`${topic}-${index}`] ? 'Hide Answer' : 'Show Answer'}
                                                                </span>
                                                            </button>
                                                            
                                                            <button
                                                                onClick={() => deleteQuestion(topic, index)}
                                                                className="flex items-center gap-1 text-red-500 hover:text-red-700
                                                                        px-3 py-1 rounded-lg hover:bg-red-50 transition-all duration-200"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                                                </svg>
                                                                <span className="text-sm font-medium">Delete</span>
                                                            </button>
                                                        </div>

                                                        {shownAnswers[`${topic}-${index}`] && (
                                                            <div className="mt-3 pl-4 border-l-2 border-blue-200 space-y-2">
                                                                {q.answer && (
                                                                    <p className="text-gray-700">
                                                                        <span className="text-blue-600 font-medium">A: </span>
                                                                        {q.answer}
                                                                    </p>
                                                                )}
                                                                {q.answerImage && (
                                                                    <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                                                                        <img 
                                                                            src={q.answerImage}
                                                                            alt="Answer visual"
                                                                            className="max-h-32 rounded-lg mx-auto"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {Object.keys(topics).length === 0 && (
                        <div className="text-center p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            <p className="text-gray-500 mb-2">No topics added yet</p>
                            <p className="text-sm text-gray-400">Create a topic to get started!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
