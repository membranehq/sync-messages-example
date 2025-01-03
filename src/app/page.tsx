import Link from "next/link"
import { AuthTest } from "@/components/auth-test"

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Integration Use Case Template
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
          This mini-app demonstrates a minimal version of your integration use
          case end to end.
        </p>
        <div className="mt-2 text-lg text-gray-600 dark:text-gray-300">
          <ul>
            <li>
              Go to <Link href="/integrations">Integrations</Link> to manage
              integrations.
            </li>
            <li>
              Go to <Link href="/use-case">Use Case</Link> to try out the
              integration logic.
            </li>
          </ul>
        </div>
      </div>
      <AuthTest />
    </div>
  )
}
