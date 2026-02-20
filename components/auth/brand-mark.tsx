import Image from "next/image"

export function BrandMark() {
  return (
    <div className="mb-16">
      <Image
        src="/mactech.png"
        alt="MacTech Solutions"
        width={280}
        height={92}
        className="h-14 xl:h-16 w-auto object-contain object-left mb-6"
        priority
      />
      <p className="text-lg xl:text-xl text-slate-400 leading-relaxed max-w-md">
        Professional training platform for modern organizations
      </p>
    </div>
  )
}
