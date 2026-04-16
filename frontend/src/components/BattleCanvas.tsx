import React, { useRef, useEffect, useState } from 'react'
import { Creature, MoveType } from '../lib/types'
import { getCreatureImage } from '../lib/assets'
import { ELEMENT_COLORS, ELEMENTS } from '../lib/constants'

interface BattleCanvasProps {
  playerCreature?: Creature;
  botCreature?: Creature;
  isAnimating?: boolean;
  activeMove?: MoveType | null;
  hoveredMove?: MoveType | null;
}

const BattleCanvas: React.FC<BattleCanvasProps> = ({ 
  playerCreature, 
  botCreature, 
  isAnimating, 
  activeMove, 
  hoveredMove 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playerImgRef = useRef<HTMLImageElement | null>(null)
  const botImgRef = useRef<HTMLImageElement | null>(null)
  const [animStart, setAnimStart] = useState<number | null>(null)

  // Preload images
  useEffect(() => {
    if (playerCreature) {
      const img = new Image()
      img.src = getCreatureImage(playerCreature.element)
      img.onload = () => { playerImgRef.current = img }
    }
    if (botCreature) {
      const img = new Image()
      img.src = getCreatureImage(botCreature.element)
      img.onload = () => { botImgRef.current = img }
    }
  }, [playerCreature, botCreature])

  // Track animation start time
  useEffect(() => {
    if (isAnimating && animStart === null) {
      setAnimStart(Date.now())
    } else if (!isAnimating) {
      setAnimStart(null)
    }
  }, [isAnimating, animStart])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let frame = 0

    const render = () => {
      frame++
      const now = Date.now()
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Screen Shake
      let shakeX = 0
      let shakeY = 0

      // Animation calculations (1800ms total)
      let elapsed = isAnimating && animStart ? now - animStart : 0
      let playerX = canvas.width * 0.25
      let botX = canvas.width * 0.75
      
      // Phase 1 (Player attacks Bot): 0 - 800ms
      // Phase 2 (Bot counter-attacks Player): 800 - 1600ms
      let drawPlayerImpact = false
      let drawBotImpact = false

      if (isAnimating && elapsed > 0) {
        if (elapsed < 400) {
          if (activeMove !== 'Defend') {
            // Player lunges forward
            const rawProgress = elapsed / 400
            const progress = 1 - Math.pow(1 - rawProgress, 3)
            playerX += progress * 150
          }
        } else if (elapsed >= 400 && elapsed < 800) {
          if (activeMove !== 'Defend') {
            // Player hit impact + retreat
            drawBotImpact = true
            if (activeMove === 'HeavyAttack' && elapsed < 600) { shakeX = (Math.random()-0.5)*15; shakeY = (Math.random()-0.5)*15 }
            else if (elapsed < 500) { shakeX = (Math.random()-0.5)*5; shakeY = (Math.random()-0.5)*5; }

            const rawProgress = (elapsed - 400) / 400
            const progress = Math.pow(rawProgress, 2)
            playerX = (canvas.width * 0.25) + 150 * (1 - progress)
          }
        } else if (elapsed >= 800 && elapsed < 1200) {
          // Bot lunges 
          const rawProgress = (elapsed - 800) / 400
          const progress = 1 - Math.pow(1 - rawProgress, 3)
          botX -= progress * 150
        } else if (elapsed >= 1200 && elapsed < 1600) {
          drawPlayerImpact = true
          // Bot hits player + retreat
          if (elapsed < 1400) { shakeX = (Math.random()-0.5)*10; shakeY = (Math.random()-0.5)*10; }
          
          const rawProgress = (elapsed - 1200) / 400
          const progress = Math.pow(rawProgress, 2)
          botX = (canvas.width * 0.75) - 150 * (1 - progress)
        }
      }

      ctx.save()
      // Apply screen shake globally
      ctx.translate(shakeX, shakeY)

      // Draw Arena Background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, 'rgba(10, 10, 21, 0)')
      gradient.addColorStop(0.7, 'rgba(21, 21, 37, 0.2)')
      gradient.addColorStop(1, 'rgba(5, 5, 16, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const floatOffset = Math.sin(frame * 0.05) * 10
      const enemyFloatOffset = Math.sin(frame * 0.04) * 8

      // HELPER: Draw procedural Elemental Hover/Impact effect
      const drawElementalEffect = (x: number, y: number, element: string, isImpact: boolean, intensity: number = 1.0) => {
        ctx.save()
        ctx.translate(x, y)
        const elColor = ELEMENT_COLORS[element as any] || '#fff'

        ctx.globalCompositeOperation = 'screen'
        
        if (element === 'Fire') {
           const count = isImpact ? 40 : 15
           for(let i=0; i<count; i++) {
             const r = isImpact ? elapsed * 0.2 : (frame + i*10) % 60
             const angle = isImpact ? (Math.PI*2/count)*i : Math.sin(frame*0.1 + i)*Math.PI
             const dist = isImpact ? r * 2 : r + 40
             const alpha = Math.max(0, 1 - (dist / 120)) * intensity
             ctx.fillStyle = `rgba(239,68,68,${alpha})`
             ctx.beginPath()
             ctx.arc(Math.cos(angle)*dist, Math.sin(angle)*dist - dist*0.5, isImpact ? 8 : 4+Math.random()*4, 0, Math.PI*2)
             ctx.fill()
           }
        } else if (element === 'Water') {
           const count = isImpact ? 10 : 3
           for(let i=0; i<count; i++) {
             const r = isImpact ? Math.min(60, elapsed * 0.3) : Math.sin(frame*0.05 + i)*20 + 60
             ctx.strokeStyle = `rgba(59,130,246,${intensity * 0.5})`
             ctx.lineWidth = isImpact ? 4 : 2
             ctx.beginPath()
             ctx.arc(0, 0, r + i*10, 0, Math.PI*2)
             ctx.stroke()
           }
        } else if (element === 'Earth') {
           const count = isImpact ? 25 : 8
           for(let i=0; i<count; i++) {
             const dist = isImpact ? Math.min(100, elapsed*0.5) : 50 + Math.sin(frame*0.1+i)*10
             const angle = (Math.PI*2/count)*i + frame*0.02
             const alpha = Math.max(0, 1 - (dist/150)) * intensity
             ctx.fillStyle = `rgba(234,179,8,${alpha})`
             ctx.fillRect(Math.cos(angle)*dist - 5, Math.sin(angle)*dist - 5, Math.random()*15, Math.random()*15)
           }
        } else if (element === 'Wind' || element === 'Shadow') {
           ctx.shadowColor = elColor
           ctx.shadowBlur = 20
           ctx.strokeStyle = elColor
           ctx.lineWidth = isImpact ? 8 : 3
           ctx.globalAlpha = intensity
           ctx.beginPath()
           ctx.arc(0, 0, isImpact ? elapsed*0.2 : 60 + Math.sin(frame*0.1)*10, 0, Math.PI*2)
           ctx.stroke()
           ctx.globalAlpha = 1.0
        }
        
        ctx.restore()
      }

      // Draw Player Creature (Left)
      if (playerImgRef.current && playerCreature) {
        ctx.save()
        let py = canvas.height * 0.55 + floatOffset
        ctx.translate(playerX, py)
        
        // Shadow base
        ctx.beginPath()
        ctx.ellipse(0, 80 - floatOffset, 40, 12, 0, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0,0,0,0.3)'
        ctx.fill()

        // Draw hover / defend shield
        if (!isAnimating && hoveredMove) {
           let intensity = hoveredMove === 'Special' ? 1.0 : hoveredMove === 'HeavyAttack' ? 0.8 : hoveredMove === 'Defend' ? 0.6 : 0.4
           drawElementalEffect(0, -20, playerCreature.element, false, intensity)
           
           if (hoveredMove === 'Defend') {
              ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)'
              ctx.shadowColor = '#22c55e'
              ctx.shadowBlur = 15
              ctx.lineWidth = 4
              ctx.beginPath()
              ctx.ellipse(0, -20, 70, 90, 0, 0, Math.PI*2)
              ctx.stroke()
              ctx.shadowBlur = 0
           }
        }

        // Active Defend state - stay put and generate force shield!
        if (isAnimating && activeMove === 'Defend' && elapsed < 1600) {
           const shieldIntensity = elapsed < 400 ? elapsed / 400 : 1.0
           ctx.strokeStyle = `rgba(34, 197, 94, ${0.8 * shieldIntensity})`
           ctx.shadowColor = '#22c55e'
           ctx.shadowBlur = Math.sin(frame * 0.2) * 10 + 20
           ctx.lineWidth = 6
           ctx.beginPath()
           ctx.ellipse(0, -20, 70 + Math.sin(frame*0.1)*5, 90 + Math.sin(frame*0.1)*5, 0, 0, Math.PI*2)
           ctx.stroke()
           ctx.shadowBlur = 0
        }

        // Draw the sprite
        const img = playerImgRef.current
        const scale = 140
        ctx.drawImage(img, -scale/2, -scale/2, scale, scale)

        // Draw Player Impact Effect if getting hit by Bot
        if (isAnimating && drawPlayerImpact) {
           drawElementalEffect(0, -20, botCreature?.element || 'Shadow', true, 1.0)
        }
        
        ctx.restore()
      }

      // Draw Enemy Creature (Right)
      if (botImgRef.current && botCreature) {
        ctx.save()
        let by = canvas.height * 0.55 + enemyFloatOffset
        ctx.translate(botX, by)
        
        ctx.scale(-1, 1)

        // Shadow base
        ctx.beginPath()
        ctx.ellipse(0, 80 - enemyFloatOffset, 40, 12, 0, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0,0,0,0.3)'
        ctx.fill()

        // Draw the sprite
        const img = botImgRef.current
        const scale = 140
        ctx.drawImage(img, -scale/2, -scale/2, scale, scale)
        
        ctx.scale(-1, 1) // reverse scale to draw impact correctly oriented

        // Draw Bot Impact Effect if getting hit by Player
        if (isAnimating && drawBotImpact) {
           drawElementalEffect(0, -20, playerCreature?.element || 'Fire', true, 1.0)
        }
        
        ctx.restore()
      }

      ctx.restore() // End global screen shake
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [playerCreature, botCreature, isAnimating, animStart, activeMove, hoveredMove])

  return (
    <div className="w-full max-w-4xl aspect-[2/1] rounded-3xl overflow-hidden relative">
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none z-10" />
      
      {/* Background Dimmer behind Canvas */}
      <div className="absolute inset-0 bg-[#07070a]/40" />

      <canvas 
        ref={canvasRef} 
        width={800} 
        height={400} 
        className="w-full h-full relative z-0"
      />
      
      {/* Screen flash on impact */}
      {isAnimating && animStart && (() => {
        const t = Date.now() - animStart
        // Flash overlay at hit times: t=400 (player hits bot) or t=1200 (bot hits player)
        if ((t > 400 && t < 450) || (t > 1200 && t < 1250)) {
           return <div className="absolute inset-0 bg-white opacity-40 pointer-events-none z-20 mix-blend-overlay" />
        }
        return null
      })()}
    </div>
  )
}

export default BattleCanvas
