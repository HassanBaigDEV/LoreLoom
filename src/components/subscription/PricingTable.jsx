import { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Container,
  Box
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { subscriptionService } from '@/lib/subscriptionService';

const plans = {
  FREE: {
    name: 'Free',
    price: 0,
    billing: 'forever',
    description: 'Perfect for getting started with story creation',
    features: [
      'Generate up to 3 stories per month',
      'Basic story customization',
      'Access to essential templates',
      'Community support',
      '', // Empty spaces for consistent height
      '',
      '',
      ''
    ],
    buttonClass: 'border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50'
  },
  BASIC: {
    name: 'Basic',
    tier: 'basic',
    price: 9.99,
    billing: 'month',
    description: 'Ideal for enthusiastic storytellers',
    features: [
      'Generate up to 15 stories per month',
      'Advanced story customization',
      'Access to all templates',
      'Priority support',
      'Export in multiple formats',
      'Collaborative writing tools',
      '',
      ''
    ],
    buttonClass: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    popular: true
  },
  PREMIUM: {
    name: 'Premium',
    tier: 'premium',
    price: 19.99,
    billing: 'month',
    description: 'For professional writers and teams',
    features: [
      'Unlimited story generation',
      'Premium story customization',
      'Custom templates creation',
      '24/7 Priority support',
      'Advanced analytics',
      'Team collaboration features',
      'White-label exports',
      'API access'
    ],
    buttonClass: 'bg-emerald-500 hover:bg-emerald-600 text-white'
  }
};

export default function PricingTable() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      if (isAuthenticated) {
        try {
          const subscription = await subscriptionService.getCurrentSubscription();
          setCurrentPlan(subscription.tier);
        } catch (error) {
          console.error('Error fetching subscription:', error);
        }
      }
    };

    fetchCurrentPlan();
  }, [isAuthenticated]);

  const handleUpgrade = async (tier) => {
    if (!isAuthenticated) {
      sessionStorage.setItem('intended_plan', tier);
      router.push('/login?redirect=/subscription');
      return;
    }

    try {
      if (tier === 'FREE') {
        await subscriptionService.upgrade(tier);
        toast.success('Successfully switched to Free plan');
        router.push('/dashboard');
        return;
      }

      const { checkout_url } = await subscriptionService.createCheckoutSession(tier);
      // window.location.href = checkout_url;
      router.push(checkout_url);
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast.error('Failed to upgrade plan. Please try again.');
    }
  };

  const renderPlanCard = (tier) => {
    const plan = plans[tier];
    const isCurrentPlan = currentPlan === plan.tier;
    const isBasic = tier === 'BASIC';

    return (
      <div className={`relative ${isBasic ? 'z-10 -mt-6' : 'z-0'} w-full h-full`}>
        <Card 
          elevation={isBasic ? 8 : 1}
          className={`
            relative h-full bg-white
            ${isBasic ? 'border-2 border-emerald-400' : 'border border-gray-200'}
            rounded-2xl overflow-hidden
          `}
        >
          {isBasic && (
            <div className="absolute top-0 transform -translate-x-1/2 -translate-y-1/2 left-1/2">
              <div className="mt-11 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-1.5 rounded-full text-sm font-semibold shadow-lg whitespace-nowrap">
                Most Popular 🔥
              </div>
            </div>
          )}
          
          <div className="flex flex-col h-full p-6">
            <div>
              <Typography variant="h5" className="mb-2 font-bold text-gray-800">
                {plan.name}
              </Typography>
              
              <Typography variant="body2" className="mb-4 text-gray-600">
                {plan.description}
              </Typography>

              <div className="mb-6">
                <Typography variant="h3" component="span" className="font-bold text-gray-900">
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                </Typography>
                <Typography variant="subtitle1" component="span" className="ml-2 text-gray-500">
                  /{plan.billing}
                </Typography>
              </div>
            </div>

            <div className="flex-grow">
              <List className="space-y-2">
                {plan.features.map((feature, index) => (
                  <ListItem 
                    key={index} 
                    disableGutters 
                    className={`flex items-start ${!feature && 'invisible'}`}
                  >
                    <ListItemIcon className="min-w-[24px] mt-1">
                      <CheckCircleIcon className="text-emerald-500" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={feature} className="text-gray-600" />
                  </ListItem>
                ))}
              </List>
            </div>

            <div className="pt-6 mt-auto">
              <Button
                fullWidth
                variant={tier === 'FREE' ? 'outlined' : 'contained'}
                disabled={isCurrentPlan}
                onClick={() => handleUpgrade(plan.tier)}
                className={`
                  py-3 rounded-xl font-semibold
                  ${isCurrentPlan ? 'opacity-50 cursor-not-allowed' : ''}
                  ${tier === 'FREE' 
                    ? 'border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50' 
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white border-none'}
                `}
              >
                {isCurrentPlan ? 'Current Plan' : 'Get Started'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="w-full px-4 py-16 bg-gray-50">
      <Container maxWidth="lg">
        <div className="grid max-w-6xl grid-cols-1 mx-auto md:grid-cols-3 gap-x-0 gap-y-8">
          {renderPlanCard('FREE')}
          {renderPlanCard('BASIC')}
          {renderPlanCard('PREMIUM')}
        </div>
      </Container>
    </div>
  );
} 