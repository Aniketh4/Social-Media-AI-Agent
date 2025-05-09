"use client"

import { motion } from "framer-motion"
import { PenLine, Sparkles, Share2 } from "lucide-react"

export default function HowItWorks() {
  const steps = [
    {
      icon: <PenLine className="h-10 w-10 text-violet-600" />,
      title: "Input Details",
      description: "Provide product name and occasion to get started with your social media post.",
      delay: 0.2,
    },
    {
      icon: <Sparkles className="h-10 w-10 text-violet-600" />,
      title: "Generate Post",
      description: "Choose to create an image or video with our advanced AI technology.",
      delay: 0.4,
    },
    {
      icon: <Share2 className="h-10 w-10 text-violet-600" />,
      title: "Edit & Share",
      description: "Customize your content and auto-post across all your social platforms.",
      delay: 0.6,
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-violet-900 mb-4">How It Works</h2>
          <p className="text-lg text-violet-700 max-w-2xl mx-auto">
            Our AI-powered platform makes creating and sharing social media content easier than ever
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white rounded-xl p-6 shadow-sm border border-violet-100 hover:shadow-md transition-shadow"
            >
              <div className="bg-violet-50 p-4 rounded-full inline-block mb-6">{step.icon}</div>
              <h3 className="text-xl font-semibold text-violet-900 mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
