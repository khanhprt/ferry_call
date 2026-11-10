import { t, tr } from './i18n.js'
import { teachersReady, teacherPortrait } from './teacher.js'
import './teacher-picker.css'

export function renderTeacherPicker(selected) {
  return tr`<div class="teacher-picker" role="group" aria-label="Chọn người lái đò">
    <div class="teacher-picker-heading"><span>Người lái đò</span><small>Chọn cô hoặc thầy đồng hành</small></div>
    <div class="teacher-choices">${[['Cô', 'female', t('Giáo viên nữ')], ['Thầy', 'male', t('Giáo viên nam')]].map(([label, kind, description]) => tr`<button class="teacher-choice ${selected === label ? 'selected' : ''}" data-teacher="${label}" aria-label="${t(label)}" aria-pressed="${selected === label}"><span class="teacher-choice-avatar"><img src="${teacherPortrait(kind)}" data-teacher-portrait="${kind}" alt=""></span><span class="teacher-choice-label"><strong>${t(label)}</strong><small>${description}</small></span><span class="teacher-choice-check" aria-hidden="true">✓</span></button>`).join('')}</div>
  </div>`
}

// Update only the portraits when the atlas finishes loading; never reset a
// teacher's name entry or pasted student list just to load a thumbnail.
teachersReady.then(() => {
  document.querySelectorAll('[data-teacher-portrait]').forEach(image => {
    image.src = teacherPortrait(image.dataset.teacherPortrait)
  })
})
