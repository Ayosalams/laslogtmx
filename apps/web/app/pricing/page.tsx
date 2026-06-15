'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  description: string;
  cta: string;
  ctaHref?: string;
  popular?: boolean;
  highlightColor?: string;
  features: string[];
}

interface ComparisonFeature {
  name: string;
  starter: boolean | string;
  pro: boolean | string;
  proBroker: boolean | string;
  enterprise: boolean | string;
}

const ELECTRIC_BLUE = '#00bfff';

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 49,
    annualPrice: 490,
    description: 'Essential tools for small fleets and owner-operators starting with compliance.',
    cta: 'Start Free Trial',
    ctaHref: '/auth/signup',
    popular: false,
    features: [
      'Basic FMCSA Compliance Hub',
      'Up to 50 loads per month',
      'Receipt OCR with correction',
      'Military time & HOS logging',
      'Basic reports & exports',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 149,
    annualPrice: 1490,
    description: 'Full platform for growing carriers and brokers. Includes Chat and MOTUS Helper.',
    cta: 'Start Free Trial',
    ctaHref: '/auth/signup',
    popular: true,
    features: [
      'Full FMCSA Compliance Hub',
      'Unlimited loads',
      'Receipt OCR with correction',
      'Company + Load-specific Chat',
      'MOTUS Helper AI assistant',
      'ELD, telematics & accounting integrations',
      'Advanced analytics & custom reports',
      'Priority email + chat support',
    ],
  },
  {
    id: 'pro_broker',
    name: 'Pro Broker',
    monthlyPrice: 199,
    annualPrice: 1990,
    description: 'Built for customs brokers. Everything in Pro plus CBLE Prep library.',
    cta: 'Start Free Trial',
    ctaHref: '/auth/signup',
    popular: false,
    highlightColor: '#00bfff',
    features: [
      'Everything in Pro',
      'CBLE Prep Library (internal training)',
      'CBLE included free on annual ($299 value)',
      'LAS pronunciation & terminology guides',
      'Broker-focused compliance workflows',
      'Priority broker support channel',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    description: 'Custom solutions with co-branding, dedicated support, and full white-label options.',
    cta: 'Contact Sales',
    popular: false,
    features: [
      'Everything in Pro',
      'Co-branded portal & assets',
      'Custom subdomain (yourfleet.laslogtmx.com)',
      'Priority phone & Slack support',
      'Dedicated success manager',
      'Custom integrations & API access',
      'SSO, advanced security & SLA',
    ],
  },
];

const comparisonFeatures: ComparisonFeature[] = [
  { name: 'CBLE Prep Library (internal training)', starter: false, pro: false, proBroker: 'Preview', enterprise: true },
  { name: 'CBLE full library ($299 value, annual)', starter: false, pro: false, proBroker: true, enterprise: true },
  { name: 'FMCSA Compliance Hub', starter: true, pro: true, proBroker: true, enterprise: true },
  { name: 'Loads per month', starter: '50', pro: 'Unlimited', proBroker: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Receipt OCR + correction', starter: true, pro: true, proBroker: true, enterprise: true },
  { name: 'Military Time (24h) everywhere', starter: true, pro: true, proBroker: true, enterprise: true },
  { name: 'Company Team Chat', starter: false, pro: true, proBroker: true, enterprise: true },
  { name: 'Load-specific Chat', starter: false, pro: true, proBroker: true, enterprise: true },
  { name: 'MOTUS Helper (AI)', starter: false, pro: true, proBroker: true, enterprise: true },
  { name: 'ELD & telematics integrations', starter: false, pro: true, proBroker: true, enterprise: true },
  { name: 'Accounting integrations', starter: false, pro: true, proBroker: true, enterprise: true },
  { name: 'Advanced analytics & exports', starter: false, pro: true, proBroker: true, enterprise: true },
  { name: 'Co-branding & white label', starter: false, pro: false, proBroker: false, enterprise: true },
  { name: 'Custom subdomain', starter: false, pro: false, proBroker: false, enterprise: true },
  { name: 'Priority support', starter: false, pro: true, proBroker: true, enterprise: true },
  { name: 'Dedicated account manager', starter: false, pro: false, proBroker: false, enterprise: true },
  { name: 'SSO & advanced security', starter: false, pro: false, proBroker: false, enterprise: true },
  { name: 'Custom SLA', starter: false, pro: false, proBroker: false, enterprise: true },
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return <span className="text-[#00bfff] text-lg leading-none">✓</span>;
  }
  if (value === false) {
    return <span className="text-gray-300 text-lg leading-none">—</span>;
  }
  return <span className="text-sm font-medium text-gray-700">{value}</span>;
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const getDisplayPrice = (plan: Plan) => {
    if (plan.monthlyPrice === null) {
      return { main: 'Custom', sub: 'Tailored for your fleet' };
    }
    if (isAnnual) {
      const monthlyEquiv = (plan.annualPrice! / 12).toFixed(0);
      return {
        main: `$${plan.annualPrice}`,
        sub: `per year • $${monthlyEquiv}/mo`,
      };
    }
    return {
      main: `$${plan.monthlyPrice}`,
      sub: 'per month',
    };
  };

  const getAnnualSavings = (plan: Plan) => {
    if (!plan.monthlyPrice || !plan.annualPrice) return null;
    const fullAnnual = plan.monthlyPrice * 12;
    const savings = fullAnnual - plan.annualPrice;
    return Math.round(savings);
  };

  return (
    <div className="py-8">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-500 border border-gray-100 mb-4">
          14-DAY FREE TRIAL • NO CARD REQUIRED
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-gray-900 mb-4">
          Pricing that grows with your fleet
        </h1>
        <p className="text-lg text-gray-600">
          Clean, professional tools built for carriers and brokers. Switch plans anytime.
          Military time and FMCSA compliance included in every tier.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center rounded-full border border-gray-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${!isAnnual
                ? 'bg-gray-900 text-white shadow'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-5 py-2 text-sm font-medium rounded-full transition-all flex items-center gap-1.5 ${isAnnual
                ? 'bg-gray-900 text-white shadow'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Annual
            <span className="text-[10px] font-semibold px-1.5 py-px rounded bg-emerald-100 text-emerald-700">
              2 MONTHS FREE
            </span>
          </button>
        </div>
      </div>

      {/* Pro Broker CBLE Spotlight */}
      <div className="max-w-4xl mx-auto mb-10">
        <div
          className="rounded-3xl border p-6 md:p-8 text-center"
          style={{ borderColor: ELECTRIC_BLUE, backgroundColor: '#f0fbff' }}
        >
          <div
            className="inline-block px-3 py-1 text-xs font-semibold tracking-wide text-white rounded-full mb-3"
            style={{ backgroundColor: ELECTRIC_BLUE }}
          >
            PRO BROKER EXCLUSIVE
          </div>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
            CBLE Prep Library — $299 value included free on annual plans
          </h2>
          <p className="mt-2 text-sm text-gray-600 max-w-2xl mx-auto">
            Internal training materials for customs broker teams: podcasts, videos, PDFs, and LAS pronunciation guides.
            Not official CBP exam material. Full library unlocked with annual Pro Broker billing.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
        {plans.map((plan) => {
          const price = getDisplayPrice(plan);
          const savings = getAnnualSavings(plan);
          const isEnterprise = plan.monthlyPrice === null;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col bg-white rounded-3xl p-8 border transition-all duration-200 ${plan.popular
                  ? 'border-[#00bfff] shadow-xl scale-[1.01] z-10'
                  : 'border-gray-100 shadow-sm hover:shadow-md'
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div
                    className="px-4 py-0.5 text-xs font-semibold tracking-wide text-white rounded-full"
                    style={{ backgroundColor: ELECTRIC_BLUE }}
                  >
                    MOST POPULAR
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-gray-900">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500 min-h-[40px]">
                  {plan.description}
                </p>
              </div>

              <div className="mt-6 mb-2">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold tracking-tighter text-gray-900">
                    {price.main}
                  </span>
                  {!isEnterprise && (
                    <span className="ml-1.5 text-base text-gray-500 font-medium">
                      {isAnnual ? '/yr' : '/mo'}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {price.sub}
                  {isAnnual && savings && (
                    <span className="ml-2 text-emerald-600 font-medium">
                      (save ${savings})
                    </span>
                  )}
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-sm flex-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-gray-700">
                    <span className="mt-0.5 text-[#00bfff] text-base leading-none select-none">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.ctaHref ? (
                <Link
                  href={plan.ctaHref}
                  className="mt-8 block w-full text-center py-3.5 rounded-2xl font-semibold text-white transition-all active:scale-[0.985]"
                  style={{ backgroundColor: ELECTRIC_BLUE }}
                >
                  {plan.cta}
                </Link>
              ) : (
                <a
                  href="mailto:sales@laslogtmx.com?subject=Enterprise%20Pricing%20Inquiry"
                  className="mt-8 block w-full text-center py-3.5 rounded-2xl font-semibold border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all active:scale-[0.985]"
                >
                  {plan.cta}
                </a>
              )}

              {plan.ctaHref && (
                <p className="text-center text-[11px] text-gray-400 mt-3">
                  14-day free trial • Cancel anytime
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Compare all features</h2>
          <p className="text-gray-600 mt-1 text-sm">Everything you need to stay compliant and efficient.</p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 px-6 font-medium text-gray-500 w-72">Feature</th>
                <th className="py-4 px-4 text-center font-semibold text-gray-900">Starter</th>
                <th className="py-4 px-4 text-center font-semibold text-gray-900">
                  <span className="inline-flex items-center gap-1.5">
                    Pro
                    <span
                      className="text-[10px] px-1.5 py-px rounded font-medium"
                      style={{ backgroundColor: '#e0f7ff', color: ELECTRIC_BLUE }}
                    >
                      RECOMMENDED
                    </span>
                  </span>
                </th>
                <th className="py-4 px-4 text-center font-semibold text-gray-900">
                  <span className="inline-flex items-center gap-1.5">
                    Pro Broker
                    <span
                      className="text-[10px] px-1.5 py-px rounded font-medium"
                      style={{ backgroundColor: '#e0f7ff', color: ELECTRIC_BLUE }}
                    >
                      CBLE
                    </span>
                  </span>
                </th>
                <th className="py-4 px-4 text-center font-semibold text-gray-900">Enterprise</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {comparisonFeatures.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-6 text-gray-700 font-medium">{row.name}</td>
                  <td className="py-3.5 px-4 text-center">
                    <FeatureValue value={row.starter} />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <FeatureValue value={row.pro} />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <FeatureValue value={row.proBroker} />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <FeatureValue value={row.enterprise} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          All plans include core military-time logging, basic FMCSA tools, and our commitment to clean, trustworthy software.
          <br />
          Questions? <a href="mailto:hello@laslogtmx.com" className="text-[#00bfff] hover:underline">Contact our team</a>.
        </div>
      </div>

      {/* Bottom CTA band */}
      <div className="mt-16 max-w-3xl mx-auto text-center">
        <div className="rounded-3xl bg-white border border-gray-100 p-8">
          <h3 className="text-xl font-semibold">Ready to modernize your compliance and operations?</h3>
          <p className="mt-2 text-gray-600">Start your free trial today. Upgrade or downgrade at any time.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center px-8 py-3 rounded-2xl font-semibold text-white transition active:scale-[0.985]"
              style={{ backgroundColor: ELECTRIC_BLUE }}
            >
              Start Free Trial
            </Link>
            <a
              href="mailto:sales@laslogtmx.com"
              className="inline-flex items-center justify-center px-8 py-3 rounded-2xl font-semibold border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition active:scale-[0.985]"
            >
              Talk to Sales
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-400">No credit card required for the 14-day trial.</p>
        </div>
      </div>
    </div>
  );
}
