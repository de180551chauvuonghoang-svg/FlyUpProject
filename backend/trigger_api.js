import 'dotenv/config';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import prisma from './src/lib/prisma.js';

async function trigger() {
  try {
    const user = await prisma.users.findFirst({
        where: { Role: 'learner' }
    });

    if (!user) {
      console.error('No learner found');
      return;
    }

    const token = jwt.sign(
      { 
        userId: user.Id, 
        email: user.Email, 
        role: user.Role,
        type: 'access'
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '1h',
        issuer: 'flyup-edutech',
        audience: 'flyup-users'
      }
    );

    console.log('Generated token for:', user.Email);

    const payload = {
        courseId: '6b6c075d-bbb1-47a1-a6b6-8cec905cd9da',
        lessonId: '6fb77257-0475-4f53-adb0-0f508f3feb90',
        count: 3,
        difficulty: 'Mixed'
    };

    console.log('Sending request to http://localhost:5000/api/ai/quiz/generate-instant...');
    
    const response = await axios.post('http://localhost:5000/api/ai/quiz/generate-instant', payload, {
        headers: {
            'Authorization': `Bearer ${token}`
        },
        timeout: 60000
    });

    console.log('SUCCESS!', response.data);
  } catch (error) {
    if (error.response) {
        console.error('API Error:', error.response.status, error.response.data);
    } else {
        console.error('Request failed:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

trigger();
