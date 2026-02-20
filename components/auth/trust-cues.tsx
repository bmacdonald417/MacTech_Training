import { Shield, TrendingUp, Users } from "lucide-react"

const cues = [
  {
    icon: Shield,
    text: "Secure, role-based access",
  },
  {
    icon: TrendingUp,
    text: "Track progress and certifications",
  },
  {
    icon: Users,
    text: "Built for scalable training programs",
  },
]

export function TrustCues() {
  return (
    <div className="space-y-6">
      {cues.map((cue, index) => {
        const Icon = cue.icon
        return (
          <div key={index} className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-slate-300 text-base font-medium">{cue.text}</p>
          </div>
        )
      })}
    </div>
  )
}
