import axios from 'axios';

const API_URL = 'https://backend-insightquest-333055764507.asia-south1.run.app/api'; // Adjust this to your backend URL

export interface QuizQuestion {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

export interface QuizResponse {
  success: boolean;
  questions: QuizQuestion[];
  message?: string;
}

export interface QuizVerificationResponse {
  success: boolean;
  score: number;
  totalQuestions: number;
  passed: boolean;
  reward?: number;
  txHash?: string;
  message?: string;
}

export interface QuizAnswer {
  questionId: string;
  question: string;
  selected_answer: string;
  correct_answer: string;
  is_correct: boolean;
  difficulty: string;
}

const QuizService = {
  async generateQuiz(
    topic: string, 
    taskTitle: string, 
    taskDescription?: string, 
    numQuestions: number = 5
  ): Promise<QuizResponse> {
    try {
      const response = await axios.post(`${API_URL}/generate-quiz`, {
        topic,
        task_title: taskTitle,
        task_description: taskDescription,
        num_questions: numQuestions
      });
      
      return response.data;
    } catch (error) {
      console.error('Error generating quiz:', error);
      return {
        success: false,
        questions: [],
        message: 'Failed to generate quiz questions'
      };
    }
  },
  
  async verifyQuiz(
    userId: string,
    taskId: string,
    answers: QuizAnswer[],
    walletAddress: string
  ): Promise<QuizVerificationResponse> {
    try {
      const response = await axios.post(`${API_URL}/verify-quiz`, {
        userId,
        taskId,
        answers,
        walletAddress
      });
      
      return response.data;
    } catch (error) {
      console.error('Error verifying quiz:', error);
      return {
        success: false,
        score: 0,
        totalQuestions: 0,
        passed: false,
        message: 'Failed to verify quiz answers'
      };
    }
  }
};

export default QuizService;