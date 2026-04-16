import { ElementType } from './types'

export const getCreatureImage = (element: ElementType): string => {
  switch (element) {
    case 'Fire':
      return '/pyra.png'
    case 'Water':
    case 'Wind':
      return '/vyra.png'
    case 'Earth':
    case 'Shadow':
      return '/nox.png'
    default:
      return '/pyra.png'
  }
}
