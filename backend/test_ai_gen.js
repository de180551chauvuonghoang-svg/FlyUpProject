import 'dotenv/config';
import { AIQuestionGenerationService } from './src/services/ai/aiQuestionGenerationService.js';
import { saveAiQuiz } from './src/services/ai/aiQuizService.js';
import prisma from './src/lib/prisma.js';

async function test() {
  try {
    console.log('[DEBUG] Prisma models:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
    
    const course = await prisma.courses.findFirst({

      include: {
        Sections: {
          include: {
            Lectures: true
          }
        }
      }
    });

    const user = await prisma.users.findFirst({
        where: { Role: 'learner' }
    });

    if (!course || !user) {
      console.error('No courses or users found in database');
      return;
    }

    const courseId = '6b6c075d-bbb1-47a1-a6b6-8cec905cd9da';
    const lessonId = '6fb77257-0475-4f53-adb0-0f508f3feb90';
    const userId = user.Id;

    const lecture = await prisma.lectures.findUnique({
        where: { Id: lessonId },
        include: { LectureMaterial: true }
    });
    console.log('[DEBUG] Lecture keys:', Object.keys(lecture || {}));
    if (lecture.LectureMaterial) console.log('[DEBUG] LectureMaterial length:', lecture.LectureMaterial.length);
    if (lecture.lectureMaterial) console.log('[DEBUG] lectureMaterial (camel) length:', lecture.lectureMaterial.length);



    console.log(`Testing with courseId: ${courseId}, lessonId: ${lessonId}, userId: ${userId}`);

    const questions = await AIQuestionGenerationService.generateQuestionsFromCourseContent(
      courseId,
      10,
      'Mixed',
      lessonId
    );

    console.log('AI success! Saving to database...');

    const quiz = await saveAiQuiz({
        courseId,
        lessonId,
        creatorId: userId,
        difficulty: 'Mixed',
        questions
    });


    console.log('Success! Saved quiz ID:', quiz.Id);
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}


test();
