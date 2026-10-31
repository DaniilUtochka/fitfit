import { render, fireEvent, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CatArt } from './index'

const frame = () =>
  act(async () => {
    await new Promise((r) => requestAnimationFrame(() => r(null)))
  })

describe('CatArt wiggle', () => {
  it('тап включает класс cat-wiggle, таймер снимает (animationend-страховка)', async () => {
    const { container } = render(<CatArt name="band" wiggle />)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.className).not.toContain('cat-wiggle')

    fireEvent.pointerDown(wrapper)
    await frame()
    expect(wrapper.className).toContain('cat-wiggle')

    // animationend в jsdom не диспатчится React-ом — сброс делает таймер (550мс)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600))
    })
    expect(wrapper.className).not.toContain('cat-wiggle')
  })

  it('повторный тап перезапускает wiggle (регресс: класс залипал навсегда)', async () => {
    const { container } = render(<CatArt name="band" wiggle />)
    const wrapper = container.firstElementChild as HTMLElement

    fireEvent.pointerDown(wrapper)
    await frame()
    expect(wrapper.className).toContain('cat-wiggle')

    await act(async () => {
      await new Promise((r) => setTimeout(r, 600))
    })
    expect(wrapper.className).not.toContain('cat-wiggle')

    fireEvent.pointerDown(wrapper)
    await frame()
    expect(wrapper.className).toContain('cat-wiggle')
  })

  it('без wiggle тап ничего не включает', async () => {
    const { container } = render(<CatArt name="band" />)
    const wrapper = container.firstElementChild as HTMLElement
    fireEvent.pointerDown(wrapper)
    await frame()
    expect(wrapper.className).not.toContain('cat-wiggle')
  })
})
