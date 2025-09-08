export const submitFeedback = async (feedbackText) => {
  try {
    const response = await fetch('https://formspree.io/f/xvgbwdra', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        feedback: feedbackText,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to submit feedback');
    }

    return { success: true };
  } catch (error) {
    // Error handling for feedback submission
    throw new Error("Couldn't send feedback. Try again?");
  }
};