import { AcademyApp } from './academy/AcademyApp'
import AnalyzerApp from './ui/App'

export default function RootApp() {
  return <AcademyApp lab={<AnalyzerApp embedded />} />
}
