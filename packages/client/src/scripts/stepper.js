function Stepper() {
  let steps = [];

  const setSteps = (newSteps) => (steps = newSteps);

  const scrollToStep = (index) => {
    console.log('Index is ', index);
    console.log('That means ', steps[index-1]);
    steps[index - 1].current.scrollIntoView({
      behavior: "smooth",
    })
  };

  return {
    setSteps,
    scrollToStep,
  };
}
const stepper = new Stepper();
export default stepper;
