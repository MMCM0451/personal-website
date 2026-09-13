'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import styles from './photos.module.css'

const photos = [
  { file: 'photo-3.jpg', alt: 'Arms outstretched at a viewpoint above snow-covered mountains.', caption: 'A little perspective.' },
  { file: 'photo-1.jpg', alt: 'A snowy portrait beside evergreen trees in falling snow.', caption: 'Caught in the snowfall.' },
  { file: 'photo-2.jpg', alt: 'A smiling portrait in the snow beside a ski lift station.', caption: 'Snow, everywhere.' },
  { file: 'photo-4.jpg', alt: 'A mountain drawing held against the view of a snowy valley.', caption: 'The view, twice.' },
  { file: 'photo-5.jpg', alt: 'Two people smiling in a cable car above snowy slopes.', caption: 'On the way up.' },
]

export default function Gallery() {
  const [active, setActive] = useState(0)
  const dialog = useRef<HTMLDialogElement>(null)
  const oldOverflow = useRef('')
  const opener = useRef<HTMLButtonElement | null>(null)
  const change = (step: number) => setActive(current => (current + step + photos.length) % photos.length)
  const restore = () => {
    document.body.style.overflow = oldOverflow.current
    opener.current?.focus()
  }
  useEffect(() => () => {
    if (dialog.current?.open) document.body.style.overflow = oldOverflow.current
  }, [])
  function open(index: number, button: HTMLButtonElement) {
    setActive(index)
    opener.current = button
    oldOverflow.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.showModal()
  }

  return <>
    <div className={styles.grid}>
      {photos.map((photo, index) => <figure key={photo.file} className={index === 0 ? styles.lead : styles.photo}>
        <button type="button" className={styles.imageButton} aria-label={`Enlarge photo ${index + 1}: ${photo.alt}`} onClick={event => open(index, event.currentTarget)}>
          <Image src={`/photos/winter/${photo.file}`} alt={photo.alt} width={960} height={1280} sizes={index === 0 ? '(max-width: 640px) 100vw, 640px' : '(max-width: 640px) 100vw, 480px'} priority={index === 0} />
          <span className={styles.enlarge} aria-hidden="true">↗</span>
        </button>
        <figcaption><span>{photo.caption}</span><span className={styles.number}>0{index + 1}</span></figcaption>
      </figure>)}
    </div>
    <dialog ref={dialog} className={styles.lightbox} aria-label="Photo viewer" onClose={restore} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close() }} onKeyDown={event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); change(1) }
      if (event.key === 'ArrowLeft') { event.preventDefault(); change(-1) }
    }}>
      <div className={styles.viewer}>
        <button type="button" autoFocus className={styles.close} onClick={() => dialog.current?.close()} aria-label="Close photo viewer">Close ×</button>
        <div className={styles.fullImage}><Image src={`/photos/winter/${photos[active].file}`} alt={photos[active].alt} fill sizes="(max-width: 640px) 100vw, 80vw" /></div>
        <div className={styles.controls}>
          <button type="button" onClick={() => change(-1)} aria-label="Previous photo">← Previous</button>
          <p aria-live="polite">{active + 1} / {photos.length}<span>{photos[active].caption}</span></p>
          <button type="button" onClick={() => change(1)} aria-label="Next photo">Next →</button>
        </div>
      </div>
    </dialog>
  </>
}
