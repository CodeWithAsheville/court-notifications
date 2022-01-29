function Stepper() {
  let steps = [];

  const setSteps = (newSteps) => (steps = newSteps);

  const scrollToStep = (index) =>
    steps[index - 1].current.scrollIntoView({
      behavior: "smooth",
    });

  return {
    setSteps,
    scrollToStep,
  };
}

export default new Stepper();
