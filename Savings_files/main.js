// Create interactive background particles
document.addEventListener('DOMContentLoaded', function() {
    // Particles background
    const particles = document.getElementById('particles');
    if (particles) {
      createParticles();
      
      function createParticles() {
        particles.innerHTML = '';
        const numParticles = Math.floor(window.innerWidth / 10);
        
        for (let i = 0; i < numParticles; i++) {
          const size = Math.random() * 5 + 1;
          const particle = document.createElement('div');
          particle.classList.add('particle');
          particle.style.width = `${size}px`;
          particle.style.height = `${size}px`;
          particle.style.left = `${Math.random() * 100}vw`;
          particle.style.top = `${Math.random() * 100}vh`;
          particle.style.opacity = Math.random() * 0.5 + 0.1;
          particles.appendChild(particle);
          
          animateParticle(particle);
        }
      }
      
      function animateParticle(particle) {
        const duration = Math.random() * 15000 + 15000;
        const xMove = Math.random() * 20 - 10;
        const yMove = Math.random() * 20 - 10;
        
        particle.animate([
          { transform: 'translate(0, 0)' },
          { transform: `translate(${xMove}vw, ${yMove}vh)` }
        ], {
          duration: duration,
          iterations: Infinity,
          direction: 'alternate',
          easing: 'ease-in-out'
        });
      }
      
      window.addEventListener('resize', createParticles);
    }
    
    // Investment calculator
    const calculateBtn = document.getElementById('calculate-btn');
    if (calculateBtn) {
      calculateBtn.addEventListener('click', calculateInvestment);
    }
    
    // FAQ accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length > 0) {
      faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
          item.classList.toggle('active');
          const toggleIcon = item.querySelector('.faq-toggle i');
          if (item.classList.contains('active')) {
            toggleIcon.className = 'fas fa-minus';
          } else {
            toggleIcon.className = 'fas fa-plus';
          }
          
          // Show/hide answer
          const answer = item.querySelector('.faq-answer');
          if (item.classList.contains('active')) {
            answer.style.display = 'block';
          } else {
            answer.style.display = 'none';
          }
        });
      });
    }
    
    // Contact form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Thank you for your message! We will get back to you soon.');
        contactForm.reset();
      });
    }
    
    // Update copyright year
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
      currentYearElement.textContent = new Date().getFullYear().toString();
    }
  });
  
  // Investment calculator function
  function calculateInvestment() {
    const initialInvestment = parseFloat(document.getElementById('initial-investment').value) || 0;
    const monthlyContribution = parseFloat(document.getElementById('monthly-contribution').value) || 0;
    const annualReturn = parseFloat(document.getElementById('annual-return').value) || 0;
    const investmentPeriod = parseInt(document.getElementById('investment-period').value) || 0;
    const compoundingFrequency = parseInt(document.getElementById('compounding-frequency').value) || 12;
    
    // Update display years
    document.getElementById('display-years').textContent = investmentPeriod;
    document.getElementById('display-initial').textContent = formatCurrency(initialInvestment, false);
    
    // Calculate future value
    const periodicRate = annualReturn / 100 / compoundingFrequency;
    const totalPeriods = investmentPeriod * compoundingFrequency;
    
    let futureValue = initialInvestment * Math.pow(1 + periodicRate, totalPeriods);
    let totalContributions = monthlyContribution * totalPeriods;
    
    if (monthlyContribution > 0) {
      futureValue += monthlyContribution * ((Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate);
    }
    
    const totalInterest = futureValue - initialInvestment - totalContributions;
    
    // Update results
    document.getElementById('future-value').textContent = formatCurrency(futureValue);
    document.getElementById('total-contributions').textContent = formatCurrency(initialInvestment + totalContributions);
    document.getElementById('total-interest').textContent = formatCurrency(totalInterest);
    document.getElementById('display-final').textContent = formatCurrency(futureValue);
    
    // Show result displays
    document.querySelector('.amount-display').style.display = 'block';
    document.querySelector('.final-amount-container').style.display = 'grid';
    
    // Create chart data
    createChart(initialInvestment, monthlyContribution, annualReturn, investmentPeriod, compoundingFrequency);
  }
  
  function formatCurrency(value, includeSymbol = true) {
    const formatted = value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    return includeSymbol ? '$' + formatted : formatted;
  }
  
  function createChart(initialInvestment, monthlyContribution, annualReturn, years, compoundingFrequency) {
    const canvas = document.getElementById('investment-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear previous chart
    if (window.investmentChart) {
      window.investmentChart.destroy();
    }
    
    // Generate chart data
    const labels = [];
    const principalData = [];
    const contributionsData = [];
    const interestData = [];
    
    const periodicRate = annualReturn / 100 / compoundingFrequency;
    
    let currentPrincipal = initialInvestment;
    let currentContributions = 0;
    
    for (let year = 0; year <= years; year++) {
      labels.push(`Year ${year}`);
      
      // For year 0, just show initial investment
      if (year === 0) {
        principalData.push(initialInvestment);
        contributionsData.push(0);
        interestData.push(0);
        continue;
      }
      
      // Calculate values for this year
      let yearlyContributions = monthlyContribution * 12;
      currentContributions += yearlyContributions;
      
      // Calculate future value at this point
      let totalAmount = initialInvestment * Math.pow(1 + periodicRate, year * compoundingFrequency);
      
      if (monthlyContribution > 0) {
        totalAmount += monthlyContribution * ((Math.pow(1 + periodicRate, year * compoundingFrequency) - 1) / periodicRate);
      }
      
      let totalInterest = totalAmount - initialInvestment - currentContributions;
      
      principalData.push(initialInvestment);
      contributionsData.push(currentContributions);
      interestData.push(totalInterest > 0 ? totalInterest : 0);
    }
    
    // Create stacked chart
    window.investmentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Initial Investment',
            data: principalData,
            backgroundColor: '#ff6a00',
            borderColor: '#e65a00',
            borderWidth: 1
          },
          {
            label: 'Contributions',
            data: contributionsData,
            backgroundColor: '#2196F3',
            borderColor: '#1976D2',
            borderWidth: 1
          },
          {
            label: 'Interest',
            data: interestData,
            backgroundColor: '#4CAF50',
            borderColor: '#388E3C',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            ticks: {
              color: '#e0e0e0'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          y: {
            stacked: true,
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              },
              color: '#e0e0e0'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: '#e0e0e0'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += '$' + context.parsed.y.toLocaleString();
                return label;
              }
            }
          }
        }
      }
    });
  }
  
  // Investment strategy selection function
  function selectInvestmentStrategy(strategy) {
    // Reset all cards
    document.querySelectorAll('.investment-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    // Select the clicked card
    document.getElementById(strategy).classList.add('selected');
    
    // Update the annual return based on the strategy
    const returnInput = document.getElementById('annual-return');
    
    switch(strategy) {
      case 'conservative':
        returnInput.value = '5';
        break;
      case 'moderate':
        returnInput.value = '7';
        break;
      case 'aggressive':
        returnInput.value = '10';
        break;
    }
    
    // Update the display
    const returnValueElement = document.getElementById('return-value');
    if (returnValueElement) {
      returnValueElement.textContent = returnInput.value + '.00%';
    }
  }
  
  // Generate financial suggestions
  function generateSuggestions() {
    const suggestionsList = document.getElementById('suggestionsList');
    if (!suggestionsList) return;
    
    suggestionsList.innerHTML = '';
    
    const suggestions = [
      {
        title: 'Start an Emergency Fund',
        content: 'Aim to save 3-6 months of living expenses in an easily accessible account.',
        icon: 'fa-shield-alt'
      },
      {
        title: 'Maximize Retirement Contributions',
        content: 'Try to contribute at least enough to get any employer match in your retirement plan.',
        icon: 'fa-piggy-bank'
      },
      {
        title: 'Pay Down High-Interest Debt',
        content: 'Prioritize paying off credit cards and loans with interest rates above 7%.',
        icon: 'fa-credit-card'
      },
      {
        title: 'Diversify Your Investments',
        content: 'Spread your investments across different asset classes to reduce risk.',
        icon: 'fa-chart-pie'
      },
      {
        title: 'Set Up Automatic Contributions',
        content: 'Automate your savings to ensure consistent investing over time.',
        icon: 'fa-clock'
      },
      {
        title: 'Consider Tax-Advantaged Accounts',
        content: 'Utilize IRAs, 401(k)s, and HSAs to maximize tax efficiency.',
        icon: 'fa-hand-holding-usd'
      },
      {
        title: 'Review Your Insurance Coverage',
        content: 'Ensure you have adequate health, life, and disability insurance.',
        icon: 'fa-umbrella'
      },
      {
        title: 'Create a Will and Estate Plan',
        content: 'Protect your assets and ensure they are distributed according to your wishes.',
        icon: 'fa-file-signature'
      },
      {
        title: 'Track Your Spending',
        content: 'Monitor where your money goes to identify areas for potential savings.',
        icon: 'fa-search-dollar'
      },
      {
        title: 'Increase Your Financial Literacy',
        content: 'Regularly educate yourself about personal finance and investing concepts.',
        icon: 'fa-book'
      }
    ];
    
    // Randomly select 3 suggestions
    const randomSuggestions = suggestions.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    randomSuggestions.forEach(suggestion => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.innerHTML = `
        <div class="suggestion-icon">
          <i class="fas ${suggestion.icon}"></i>
        </div>
        <div class="suggestion-content">
          <h3>${suggestion.title}</h3>
          <p>${suggestion.content}</p>
        </div>
      `;
      suggestionsList.appendChild(item);
    });
  }