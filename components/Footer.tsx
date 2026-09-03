import Link from "next/link"
import { Clock, Mail, FileText, Facebook, Youtube, Linkedin, Instagram } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'

interface FooterProps {
  noPadding?: boolean
}

export function Footer({}: FooterProps) {
  const t = useTranslations('footer')
  const params = useParams()
  const locale = params.locale as string

  return (
    <>
      {/* Contact Section Above Footer */}
      <div className="bg-gray-50 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
              {t('contact.title')}
            </h2>
            <p className="text-teal-600 text-xl md:text-2xl font-semibold">
              +389 76 338 000
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 border-2 border-teal-600 rounded-full flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-teal-600" />
              </div>
              <p className="text-gray-600 font-medium">{t('contact.workingHours')}</p>
              <p className="text-gray-500 text-sm">
                {t('contact.workingHoursSchedule.weekdays')}: {t('contact.workingHoursSchedule.weekdaysTime')}
              </p>
              <p className="text-gray-500 text-sm">
                {t('contact.workingHoursSchedule.saturday')}: {t('contact.workingHoursSchedule.saturdayTime')}
              </p>
              <p className="text-gray-500 text-sm">
                {t('contact.workingHoursSchedule.sunday')}: {t('contact.workingHoursSchedule.closed')}
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 border-2 border-teal-600 rounded-full flex items-center justify-center mb-3">
                <Mail className="w-6 h-6 text-teal-600" />
              </div>
              <p className="text-gray-600 font-medium">{t('contact.email')}</p>
              <p className="text-teal-600 text-sm">info-macedonia@eglo.com</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 border-2 border-teal-600 rounded-full flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-teal-600" />
              </div>
              <p className="text-gray-600 font-medium">{t('contact.contactForm')}</p>
              <p className="text-teal-600 text-sm">{t('contact.getInTouch')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <footer className="bg-gray-900 text-white py-8 md:py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 md:gap-8">
            {/* Brand and Description */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-teal-600 rounded mr-3"></div>
                <span className="text-xl md:text-2xl font-bold">EGLO</span>
              </div>
              <p className="text-gray-400 mb-4 text-sm md:text-base">
                {t('brand.description')}
              </p>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold mb-3 md:mb-4 text-sm md:text-base uppercase">{t('sections.company')}</h3>
              <ul className="space-y-1 md:space-y-2 text-gray-400 text-sm md:text-base">
                <li>
                  <Link href={`/${locale}/about`} className="hover:text-white transition-colors">
                    {t('links.aboutEglo')}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/worldwide`} className="hover:text-white transition-colors">
                    {t('links.egloWorldwide')}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/principles`} className="hover:text-white transition-colors">
                    {t('links.ourPrinciples')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Career */}
            <div>
              <h3 className="font-semibold mb-3 md:mb-4 text-sm md:text-base uppercase">{t('sections.career')}</h3>
              <ul className="space-y-1 md:space-y-2 text-gray-400 text-sm md:text-base">
                <li>
                  <Link href={`/${locale}/working-at-eglo`} className="hover:text-white transition-colors">
                    {t('links.workingAtEglo')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Service */}
            <div>
              <h3 className="font-semibold mb-3 md:mb-4 text-sm md:text-base uppercase">{t('sections.service')}</h3>
              <ul className="space-y-1 md:space-y-2 text-gray-400 text-sm md:text-base">
                <li>
                  <Link href={`/${locale}/warranty`} className="hover:text-white transition-colors">
                    {t('links.warrantyConditions')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    {t('links.properRecycling')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    {t('links.downloads')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social Networks */}
            <div>
              <h3 className="font-semibold mb-3 md:mb-4 text-sm md:text-base uppercase">{t('sections.socialNetworks')}</h3>
              <div className="flex space-x-3">
                <Link 
                  href="https://www.facebook.com/eglo.mk" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Follow us on Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </Link>
                <Link 
                  href="https://www.youtube.com/user/EGLOunited" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Follow us on YouTube"
                >
                  <Youtube className="w-5 h-5" />
                </Link>
                <Link 
                  href="https://at.pinterest.com/eglounited/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Follow us on Pinterest"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                  </svg>
                </Link>
                <Link 
                  href="https://www.linkedin.com/company/eglo-leuchten-gmbh/?originalSubdomain=at" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Follow us on LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </Link>
                <Link 
                  href="https://www.instagram.com/eglo.macedonia/?hl=en" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Follow us on Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-6 md:mt-8 pt-6 md:pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-xs md:text-sm">
              <div className="mb-2 md:mb-0">
                <p>{t('bottom.copyright')}</p>
                <Link
                  href="https://nativeai.cloud/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-white transition-colors text-xs"
                >
                  {t('bottom.credit')}
                </Link>
              </div>
              <div className="text-center mb-2 md:mb-0 max-w-2xl">
                <p>
                  {t('bottom.legalText')}
                </p>
              </div>
              <div className="flex space-x-4">
                <Link href="#" className="hover:text-white transition-colors">
                  {t('bottom.privacyPolicies')}
                </Link>
                <span>|</span>
                <Link href="#" className="hover:text-white transition-colors">
                  {t('bottom.print')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
