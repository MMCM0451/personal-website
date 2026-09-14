'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import styles from './photos.module.css'

type Photo = { src: string; alt: string; caption: string; width: number; height: number }

export default function Gallery({ photos, title, priority = false }: { photos: Photo[]; title: string; priority?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const previewCount = 6
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
      {(expanded ? photos : photos.slice(0, previewCount)).map((photo, index) => <figure key={photo.src} className={index === 0 ? (photo.width > photo.height ? styles.landscapeLead : styles.lead) : photo.width > photo.height ? styles.landscape : styles.photo}>
        <button type="button" className={styles.imageButton} aria-label={`Enlarge photo ${index + 1}: ${photo.alt}`} onClick={event => open(index, event.currentTarget)}>
          <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes={photo.width > photo.height ? '(max-width: 1040px) 100vw, 976px' : index === 0 ? '(max-width: 640px) 100vw, 640px' : '(max-width: 640px) 100vw, 480px'} priority={priority && index === 0} />
          <span className={styles.enlarge} aria-hidden="true">↗</span>
        </button>
        <figcaption><span>{photo.caption}</span><span className={styles.number}>{String(index + 1).padStart(2, '0')}</span></figcaption>
      </figure>)}
    </div>
    {photos.length > previewCount && <div className={styles.albumActions}><p>{expanded ? photos.length : previewCount} of {photos.length} photographs</p><button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? 'Show highlights −' : 'See all ' + photos.length + ' photos +'}</button></div>}
    <dialog ref={dialog} className={styles.lightbox} aria-label={title + ' — photo viewer'} onClose={restore} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close() }} onKeyDown={event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); change(1) }
      if (event.key === 'ArrowLeft') { event.preventDefault(); change(-1) }
    }}>
      <div className={styles.viewer}>
        <button type="button" autoFocus className={styles.close} onClick={() => dialog.current?.close()} aria-label="Close photo viewer">Close ×</button>
        <div className={styles.fullImage}><Image src={photos[active].src} alt={photos[active].alt} fill sizes="(max-width: 640px) 100vw, 80vw" /></div>
        <div className={styles.controls}>
          <button type="button" onClick={() => change(-1)} aria-label="Previous photo">← Previous</button>
          <p aria-live="polite">{active + 1} / {photos.length}<span>{photos[active].caption}</span></p>
          <button type="button" onClick={() => change(1)} aria-label="Next photo">Next →</button>
        </div>
      </div>
    </dialog>
  </>
}
