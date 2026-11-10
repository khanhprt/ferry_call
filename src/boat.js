import { teachersReady, renderTeacher } from './teacher.js'

export const boatLayers = {
  rear: '/boat/rear.png',
  front: '/boat/front.png',
}

// Decode both registered PNGs before showing the assembled boat.
export const boatReady = Promise.all([teachersReady, ...Object.values(boatLayers).map(source => {
  const image = new Image()
  image.src = source
  return image.decode()
})])

export function renderBoat(passengers, teacher) {
  return `<div class="boat-wrap"><div class="boat-stage ferry-assembly">
    <img class="ferry-layer ferry-rear" src="${boatLayers.rear}" alt="" aria-hidden="true">
    <div class="ferry-occupants">
      ${renderTeacher(teacher)}
      <div class="passengers">${passengers}</div>
    </div>
    <img class="ferry-layer ferry-front" src="${boatLayers.front}" alt="" aria-hidden="true">
    <svg class="hull-wake" viewBox="0 0 1000 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 20 Q80 0 160 23 T320 25 T480 22 T640 26 T800 21 T1000 18"/><path d="M50 50 Q160 20 280 51 M370 62 Q530 31 680 56 M755 42 Q860 22 960 42"/></svg>
  </div></div>`
}
