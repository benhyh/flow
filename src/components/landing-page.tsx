"use client"

import DarkVeil from "@/components/dark-veil-webgl"
import Image from "next/image"
import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { gsap } from "gsap"
import { ArrowRight } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const introducingRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const arrowRef = useRef<HTMLDivElement>(null)

  const handleGetStarted = () => {
    router.push('/auth')
  }

  useEffect(() => {
    const tl = gsap.timeline()

    // Set initial states
    gsap.set(introducingRef.current, { y: -50, opacity: 0 })
    gsap.set(contentRef.current?.children, { y: 50, opacity: 0 })
    gsap.set(buttonRef.current, { y: 50, opacity: 0 })

    // Animate introducing tag from top
    tl.to(introducingRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power2.out",
    })

      // Animate content from bottom with stagger
      .to(
        contentRef.current?.children,
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
        },
        "-=0.4",
      )
      .to(
        buttonRef.current,
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.6",
      )

    const button = buttonRef.current
    const arrow = arrowRef.current

    if (button && arrow) {
      gsap.set(arrow, {
        opacity: 0,
        x: 20,
        width: 0,
      })

      const handleMouseEnter = () => {
        gsap.to(arrow, {
          opacity: 1,
          x: 0,
          width: "auto",
          duration: 0.15,
          ease: "power2.out",
        })
      }

      const handleMouseLeave = () => {
        gsap.to(arrow, {
          opacity: 0,
          x: 20,
          width: 0,
          duration: 0.15,
          ease: "power2.out",
        })
      }

      button.addEventListener("mouseenter", handleMouseEnter)
      button.addEventListener("mouseleave", handleMouseLeave)

      return () => {
        button.removeEventListener("mouseenter", handleMouseEnter)
        button.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      <DarkVeil
        speed={0.5}
        hueShift={0}
        noiseIntensity={0.02}
        scanlineIntensity={0}
        scanlineFrequency={0}
        warpAmount={0.1}
        resolutionScale={1}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center max-w-4xl px-4">
          {/* Logo and Introducing section */}
          <div ref={introducingRef} className="flex items-center justify-center">
            <div className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent font-sans font-medium text-xl">
              Introducing
            </div>
            <div className="flex items-center">
              <Image src="/logo-no-bg.png" alt="Logo" width={48} height={48} className="w-12 h-12" />
              <div className="font-[var(--font-unbounded)] font-semibold text-2xl text-white">FLOW</div>
            </div>
          </div>

          <div ref={contentRef}>
            {/* Main heading */}
            <h1 className="font-sans text-white text-4xl md:text-5xl lg:text-6xl xl:text-[65px] leading-tight mb-6">
              We automate your workflow
            </h1>

            {/* Secondary text */}
            <p className="font-sans text-white/50 text-lg md:text-xl lg:text-2xl xl:text-[28px] leading-relaxed mb-12 max-w-2xl mx-auto">
              Effortlessly organize, track, and automate your tasks across platforms
            </p>
          </div>

          <button
            ref={buttonRef}
            onClick={handleGetStarted}
            className="group relative cursor-pointer overflow-hidden rounded-full border border-zinc-300 bg-white text-zinc-800 px-6 py-3 text-center font-semibold hover:bg-transparent hover:text-white hover:border-white transition-all duration-150 font-sans font-medium text-xs uppercase tracking-tight rounded-[35px]"
          >
            <div className="flex items-center gap-2">
              <span className="text-zinc-800 group-hover:text-white transition-all duration-150">Get Started</span>
              <div ref={arrowRef} className="overflow-hidden">
                <ArrowRight className="h-4 w-4 text-zinc-800 group-hover:text-white transition-all duration-150" />
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
