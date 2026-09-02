import { mockConsultants } from '../data/mockData'

export default function ConsultantsPage() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-gray-900 font-mono">CONSULTANTS_MASTER</h2>
        <p className="text-xs text-gray-500 font-mono mt-0.5">List of active and inactive consultants in the system</p>
      </div>

      <div className="border border-gray-200 rounded overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-left text-xs font-mono">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium text-gray-500">ID</th>
              <th scope="col" className="px-4 py-2 font-medium text-gray-500">Name</th>
              <th scope="col" className="px-4 py-2 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {mockConsultants.map((con) => (
              <tr key={con.id} className="hover:bg-gray-50/50">
                <td className="whitespace-nowrap px-4 py-2 text-gray-900 font-semibold">{con.id}</td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-600">{con.name}</td>
                <td className="whitespace-nowrap px-4 py-2">
                  <span className={`inline-flex rounded px-1 py-0.5 text-[10px] font-medium ${
                    con.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
                  }`}>
                    {con.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
