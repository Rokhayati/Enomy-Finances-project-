document.addEventListener('DOMContentLoaded', () => {

  // ===== Currency Converter Logic =====
  const fromCurrency = document.getElementById('fromCurrency');
  const toCurrency = document.getElementById('toCurrency');
  const converterForm = document.getElementById('converterForm');
  const amountInput = document.getElementById('amount');
  const converted = document.getElementById('converted');
  const currencyChart = document.getElementById('currencyChart')?.getContext('2d');

  const currencies = ['USD', 'EUR', 'GBP', 'AED', 'JPY', 'INR','XAF','AMD'];

  currencies.forEach(currency => {
    const optionFrom = document.createElement('option');
    optionFrom.value = currency;
    optionFrom.textContent = currency;
    fromCurrency.appendChild(optionFrom);

    const optionTo = document.createElement('option');
    optionTo.value = currency;
    optionTo.textContent = currency;
    toCurrency.appendChild(optionTo);
  });

  fromCurrency.value = 'USD';
  toCurrency.value = 'EUR';

  converterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseFloat(amountInput.value);
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (isNaN(amount) || amount <= 0) {
      converted.textContent = 'Please enter a valid amount.';
      return;
    }

    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
      const data = await response.json();
      const rate = data.rates[to];
      const result = (amount * rate).toFixed(2);
      converted.textContent = `${amount} ${from} = ${result} ${to}`;

      // Update Chart
      if (currencyChart) {
        new Chart(currencyChart, {
          type: 'line',
          data: {
            labels: Object.keys(data.rates),
            datasets: [{
              label: `Exchange Rates for ${from}`,
              data: Object.values(data.rates),
              borderColor: '#FFA500',
              backgroundColor: 'rgba(255, 165, 0, 0.2)',
              fill: true,
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: false
              }
            }
          }
        });
      }

    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      converted.textContent = 'Failed to fetch exchange rates. Please try again later.';
    }
  });

  // ===== Dropdown Menu Toggle Logic =====
  const dropdowns = document.querySelectorAll('.dropdown');
  dropdowns.forEach(dropdown => {
    const button = dropdown.querySelector('.dropbtn');
    const content = dropdown.querySelector('.dropdown-content');

    button.addEventListener('click', (e) => {
      e.preventDefault();
      dropdowns.forEach(d => {
        if (d !== dropdown) {
          d.querySelector('.dropdown-content').classList.remove('show');
        }
      });
      content.classList.toggle('show');
    });
  });

  window.addEventListener('click', (e) => {
    if (!e.target.matches('.dropbtn')) {
      document.querySelectorAll('.dropdown-content').forEach(content => {
        content.classList.remove('show');
      });
    }
  });

  // ===== Redirect Button Logic =====
  function redirectToSavings() {
    window.location.href = 'savings.html';
  }

  // ===== Chatbot Toggle + Logic =====
  const toggle = document.getElementById("chatbotToggle");
  const chatbot = document.getElementById("chatbotContainer");
  const chatbotMessages = document.getElementById("chatbotMessages");
  const input = document.getElementById("userInput");

  toggle.addEventListener("click", () => {
    chatbot.style.display = chatbot.style.display === "none" ? "block" : "none";
  });

  window.addEventListener("scroll", () => {
    const section2 = document.getElementById("section2");
    if (!section2) return;
    const rect = section2.getBoundingClientRect();
    toggle.style.display = rect.top < window.innerHeight ? "flex" : "none";
  });

  async function sendMessage() {
    const userMessage = input.value.trim();
    if (!userMessage) return;

    chatbotMessages.innerHTML += `<p><strong>You:</strong> ${userMessage}</p>`;
    input.value = "";
    chatbotMessages.innerHTML += `<p><em>Bot is thinking...</em></p>`;
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer sk-proj-xxxx..."
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant for a Currency Converter and Chart app. Answer questions related to the app." },
            { role: "user", content: userMessage }
          ],
          temperature: 0.5
        })
      });

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || "I'm not sure how to help with that.";
      document.querySelector("em").parentElement.remove();
      chatbotMessages.innerHTML += `<p><strong>Bot:</strong> ${reply}</p>`;
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

    } catch (error) {
      console.error("Error:", error);
      chatbotMessages.innerHTML += `<p style="color: red;"><strong>Bot:</strong> Error fetching response.</p>`;
    }
  }

  // ===== File Upload Logic =====
  const uploadForm = document.getElementById('uploadForm');
  const fileInput = document.getElementById('fileInput');
  const uploadStatus = document.getElementById('uploadStatus');

  if (uploadForm && fileInput && uploadStatus) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const file = fileInput.files[0];
      if (!file) {
        uploadStatus.textContent = 'Please select a file to upload.';
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        if (response.ok) {
          uploadStatus.textContent = result.message;
          uploadStatus.style.color = 'green';
        } else {
          uploadStatus.textContent = result.message || 'Upload failed.';
          uploadStatus.style.color = 'red';
        }
      } catch (err) {
        console.error(err);
        uploadStatus.textContent = 'An error occurred while uploading.';
        uploadStatus.style.color = 'red';
      }
    });
  }

});
