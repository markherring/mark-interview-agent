import Link from 'next/link'

interface InterviewHeaderProps {
  company: string
}

export function InterviewHeader({ company }: InterviewHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between">
        {/* Left side: Name, Title, LinkedIn */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            MARK HERRING
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Chief Marketing Officer
          </p>
          <Link
            href="https://linkedin.com/in/herringmark"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-mark-blue hover:underline"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            linkedin.com/in/herringmark
          </Link>
        </div>

        {/* Center: Photo */}
        <div className="flex-shrink-0 mx-6">
          <div className="w-24 h-24 relative rounded-full overflow-hidden border-3 border-mark-blue">
            <img
              src="/mark-herring.jpg"
              alt="Mark Herring"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right side: Company context */}
        <div className="flex-1 text-right">
          <div className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2 rounded-lg shadow-md">
            <p className="text-xs font-medium opacity-90">Interview Context</p>
            <p className="text-xl font-bold">{company}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-gray-200">
        <p className="text-sm text-gray-700 leading-relaxed">
          <strong>Technically fluent marketing leader</strong> who builds GTM engines for technical infrastructure companies.
          Proven track record scaling revenue from $1M → $30M ARR (InfluxData), doubling qualified pipeline to $53M (HiveMQ),
          and building hybrid PLG + enterprise motions. Expert in databases, IoT platforms, developer tools, and security infrastructure.
        </p>
      </div>
    </div>
  )
}
