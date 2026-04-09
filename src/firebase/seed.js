import { db } from './config';
import { doc, setDoc } from 'firebase/firestore';

const plantsLesson = {
  id: 'plants-science-01',
  title: 'All About Plants',
  description: 'Learn how plants grow, eat, and breathe.',
  sections: [
    {
      id: 's1',
      title: 'What are Plants?',
      content: 'Plants are living things that grow on land or in water. Unlike animals, they cannot move around and they make their own food.'
    },
    {
      id: 's2',
      title: 'Photosynthesis',
      content: 'Photosynthesis is the process plants use to make food. They take in sunlight, carbon dioxide, and water to create sugar and oxygen.'
    },
    {
      id: 's3',
      title: 'Parts of a Plant',
      content: 'Roots hold the plant in the ground and soak up water. Leaves capture sunlight. The stem carries water to the rest of the plant.'
    },
    {
      id: 's4',
      title: 'Conclusion',
      content: 'Plants are essential for life on Earth because they provide oxygen for us to breathe and food for us to eat.'
    }
  ]
};

export const seedLessons = async () => {
  try {
    await setDoc(doc(db, 'lessons', plantsLesson.id), plantsLesson);
    console.log('Plants lesson seeded successfully!');
  } catch (error) {
    console.error('Error seeding lesson:', error);
  }
};
