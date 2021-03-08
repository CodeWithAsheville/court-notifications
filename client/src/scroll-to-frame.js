function scrollToFrame() {

  let frameRef = undefined
  const setElement = ref => frameRef = ref

  const execute = () => frameRef.current.scrollIntoView({
    behavior: 'smooth',
    block: 'end',
    inline: 'end'
  })

  return {
    setElement,
    execute
  }
}

const singleton = scrollToFrame()

export default singleton

