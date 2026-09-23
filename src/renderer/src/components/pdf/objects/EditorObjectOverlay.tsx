/**
 * EditorObjectOverlay — Hệ thống Overlay hiển thị và tương tác đối tượng trên từng trang PDF
 * Tách biệt 4 lớp: Canvas -> Overlay -> Content Renderers -> Selection Layer.
 * Kéo thả & co giãn 60 FPS bằng phần cứng GPU (translate3d) và commit chuẩn PDF Points.
 */

import React, { useRef } from 'react'
import { EditorObject } from '../../../core/editor/EditorObjects'
import { useEditorObjectsStore } from '../../../stores/pdfEditorObjects.store'
import { ShapeObjectRenderer } from './ShapeObjectRenderer'
import { ImageObjectRenderer } from './ImageObjectRenderer'
import { TextObjectRenderer } from './TextObjectRenderer'
import { HighlightObjectRenderer } from './HighlightObjectRenderer'
import { SignatureObjectRenderer } from './SignatureObjectRenderer'
import { SelectionLayer } from './SelectionLayer'

interface EditorObjectOverlayProps {
  pageIndex: number
  displayWidth: number
  displayHeight: number
  zoomLevel: number
}

export function EditorObjectOverlay({
  pageIndex,
  displayWidth,
  displayHeight,
  zoomLevel
}: EditorObjectOverlayProps) {
  const {
    objects,
    selectedObjectId,
    setSelectedObjectId,
    updateObject,
    removeObject,
    duplicateObject,
    bringForward,
    sendBackward,
    startDragTransaction,
    commitDragTransaction
  } = useEditorObjectsStore()

  const scale = zoomLevel / 100
  const pageObjects = objects.filter((o) => o.pageIndex === pageIndex)
  const domRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Trạng thái kéo thả / co giãn đối tượng
  const interactionRef = useRef<{
    objectId: string
    isDragging: boolean
    isResizing: string | null
    startX: number
    startY: number
    initX: number // Screen pixels
    initY: number
    initW: number
    initH: number
    initPdfX: number // PDF Points
    initPdfY: number
    initPdfW: number
    initPdfH: number
    currentX: number
    currentY: number
    currentW: number
    currentH: number
  } | null>(null)

  // 1. Bắt đầu Kéo thả đối tượng (Drag)
  const handleObjectMouseDown = (e: React.MouseEvent, obj: EditorObject) => {
    e.stopPropagation()
    setSelectedObjectId(obj.id)

    const el = domRefs.current.get(obj.id)
    if (!el) return

    const screenX = obj.x * scale
    const screenY = obj.y * scale
    const screenW = obj.width * scale
    const screenH = obj.height * scale

    startDragTransaction(`Di chuyển ${obj.label || obj.type}`)

    interactionRef.current = {
      objectId: obj.id,
      isDragging: true,
      isResizing: null,
      startX: e.clientX,
      startY: e.clientY,
      initX: screenX,
      initY: screenY,
      initW: screenW,
      initH: screenH,
      initPdfX: obj.x,
      initPdfY: obj.y,
      initPdfW: obj.width,
      initPdfH: obj.height,
      currentX: screenX,
      currentY: screenY,
      currentW: screenW,
      currentH: screenH
    }

    const handleGlobalMouseMove = (moveEvent: MouseEvent) => {
      const info = interactionRef.current
      if (!info || !info.isDragging) return
      const targetEl = domRefs.current.get(info.objectId)
      if (!targetEl) return

      const dx = moveEvent.clientX - info.startX
      const dy = moveEvent.clientY - info.startY

      info.currentX = Math.max(0, info.initX + dx)
      info.currentY = Math.max(0, info.initY + dy)

      // Di chuyển trực tiếp bằng GPU transform 60 FPS (không kích hoạt React state)
      targetEl.style.transform = `translate3d(${dx}px, ${dy}px, 0)`
    }

    const handleGlobalMouseUp = () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)

      const info = interactionRef.current
      if (info && info.isDragging) {
        const targetEl = domRefs.current.get(info.objectId)
        if (targetEl) {
          targetEl.style.transform = ''
        }

        // Quy đổi delta từ Screen Pixels ngược lại thành PDF Points bất biến
        const finalPdfX = Math.round(info.initPdfX + (info.currentX - info.initX) / scale)
        const finalPdfY = Math.round(info.initPdfY + (info.currentY - info.initY) / scale)

        updateObject(info.objectId, {
          x: Math.max(0, finalPdfX),
          y: Math.max(0, finalPdfY)
        }, false)

        commitDragTransaction()
      }
      interactionRef.current = null
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)
  }

  // 2. Bắt đầu Co giãn đối tượng (Resize)
  const handleResizeStart = (e: React.MouseEvent, obj: EditorObject, handle: string) => {
    e.stopPropagation()
    const el = domRefs.current.get(obj.id)
    if (!el) return

    const screenX = obj.x * scale
    const screenY = obj.y * scale
    const screenW = obj.width * scale
    const screenH = obj.height * scale

    startDragTransaction(`Co giãn ${obj.label || obj.type}`)

    interactionRef.current = {
      objectId: obj.id,
      isDragging: false,
      isResizing: handle,
      startX: e.clientX,
      startY: e.clientY,
      initX: screenX,
      initY: screenY,
      initW: screenW,
      initH: screenH,
      initPdfX: obj.x,
      initPdfY: obj.y,
      initPdfW: obj.width,
      initPdfH: obj.height,
      currentX: screenX,
      currentY: screenY,
      currentW: screenW,
      currentH: screenH
    }

    const handleGlobalMouseMove = (moveEvent: MouseEvent) => {
      const info = interactionRef.current
      if (!info || !info.isResizing) return
      const targetEl = domRefs.current.get(info.objectId)
      if (!targetEl) return

      const dx = moveEvent.clientX - info.startX
      const dy = moveEvent.clientY - info.startY

      let newW = info.initW
      let newH = info.initH
      let newX = info.initX
      let newY = info.initY

      if (info.isResizing.includes('e')) newW = Math.max(20 * scale, info.initW + dx)
      if (info.isResizing.includes('s')) newH = Math.max(15 * scale, info.initH + dy)
      if (info.isResizing.includes('w')) {
        const diff = Math.min(dx, info.initW - 20 * scale)
        newW = info.initW - diff
        newX = info.initX + diff
      }
      if (info.isResizing.includes('n')) {
        const diff = Math.min(dy, info.initH - 15 * scale)
        newH = info.initH - diff
        newY = info.initY + diff
      }

      info.currentX = newX
      info.currentY = newY
      info.currentW = newW
      info.currentH = newH

      targetEl.style.width = `${newW}px`
      targetEl.style.height = `${newH}px`
      targetEl.style.transform = `translate3d(${newX - info.initX}px, ${newY - info.initY}px, 0)`
    }

    const handleGlobalMouseUp = () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)

      const info = interactionRef.current
      if (info && info.isResizing) {
        const targetEl = domRefs.current.get(info.objectId)
        if (targetEl) {
          targetEl.style.transform = ''
        }

        // Quy đổi kích thước và vị trí cuối cùng về PDF Points
        const finalPdfX = Math.round(info.currentX / scale)
        const finalPdfY = Math.round(info.currentY / scale)
        const finalPdfW = Math.round(info.currentW / scale)
        const finalPdfH = Math.round(info.currentH / scale)

        updateObject(info.objectId, {
          x: Math.max(0, finalPdfX),
          y: Math.max(0, finalPdfY),
          width: Math.max(20, finalPdfW),
          height: Math.max(15, finalPdfH)
        }, false)

        commitDragTransaction()
      }
      interactionRef.current = null
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)
  }

  return (
    <div
      className="pdf-editor-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
        pointerEvents: 'none',
        overflow: 'visible'
      }}
    >
      {pageObjects.map((obj) => {
        const isSelected = selectedObjectId === obj.id
        const screenX = Math.round(obj.x * scale)
        const screenY = Math.round(obj.y * scale)
        const screenW = Math.round(obj.width * scale)
        const screenH = Math.round(obj.height * scale)

        return (
          <div
            key={obj.id}
            ref={(el) => {
              if (el) domRefs.current.set(obj.id, el)
              else domRefs.current.delete(obj.id)
            }}
            className={`pdf-editor-object-container ${isSelected ? 'selected' : ''}`}
            style={{
              position: 'absolute',
              left: `${screenX}px`,
              top: `${screenY}px`,
              width: `${screenW}px`,
              height: `${screenH}px`,
              cursor: isSelected ? 'move' : 'pointer',
              pointerEvents: 'auto',
              userSelect: 'none',
              zIndex: obj.zIndex || 20,
              willChange: 'transform'
            }}
            onMouseDown={(e) => handleObjectMouseDown(e, obj)}
          >
            {/* LỚP 2: Render Nội dung Object Độc lập theo loại */}
            {obj.type === 'shape' && (
              <ShapeObjectRenderer object={obj} width={screenW} height={screenH} scale={scale} />
            )}

            {obj.type === 'image' && (
              <ImageObjectRenderer object={obj} width={screenW} height={screenH} />
            )}

            {obj.type === 'text' && (
              <TextObjectRenderer
                object={obj}
                width={screenW}
                height={screenH}
                scale={scale}
                isSelected={isSelected}
                onUpdateText={(newText) => updateObject(obj.id, { text: newText })}
              />
            )}

            {obj.type === 'highlight' && (
              <HighlightObjectRenderer object={obj} width={screenW} height={screenH} />
            )}

            {obj.type === 'signature' && (
              <SignatureObjectRenderer object={obj} width={screenW} height={screenH} />
            )}

            {/* LỚP 4: Selection Layer (Chỉ render khi Object được chọn) */}
            {isSelected && (
              <SelectionLayer
                object={obj}
                width={screenW}
                height={screenH}
                onResizeStart={(e, h) => handleResizeStart(e, obj, h)}
                onUpdate={(updates) => updateObject(obj.id, updates)}
                onDuplicate={() => duplicateObject(obj.id)}
                onDelete={() => removeObject(obj.id)}
                onBringForward={() => bringForward(obj.id)}
                onSendBackward={() => sendBackward(obj.id)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
