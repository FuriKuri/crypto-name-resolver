function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function namehash(name) {
  const hashArray = hash(name);
  return arrayToHex(hashArray);
}

function hash(name) {
  if (!name) {
      return new Uint8Array(32);
  }
  const [label, ...remainder] = name.split('.');
  const labelHash = keccak_256.array(label);
  const remainderHash = hash(remainder.join('.'));
  return keccak_256.array(new Uint8Array([...remainderHash, ...labelHash]));
}

function arrayToHex(arr) {
  return '0x' + Array.prototype.map.call(arr, x => ('00' + x.toString(16)).slice(-2)).join('');
}

async function load() {
  let url = 'https://raw.githubusercontent.com/unstoppabledomains/resolution/master/src/config/supported-keys.json';
  let obj = await (await fetch(url)).json();
  return obj;
}

function display(owner, resolver, keyResults) {
  document.getElementById("owner").textContent = owner;
  document.getElementById("resolver").textContent = resolver;
  const keyContent = Object.getOwnPropertyNames(keyResults).map(key => {
    return `${key}: ${keyResults[key]}`;
  }).forEach(key => {
    var li = document.createElement("li");
    li.appendChild(document.createTextNode(key));
    document.getElementById("key-items").appendChild(li);
  });
}

async function resolve() {
  const userInput = document.getElementById("domain-input").value;
  console.log(userInput);

  const tokenId = namehash(userInput);

  const supportedKeys = await load();

  const keys = Object.keys(supportedKeys.keys);

  fetchContractData(keys, tokenId).then(data => {
    const owner = data.owner;
    const resolver = data.resolver;
    const keyResults = data[2];

    const result = keyResults
      .reduce((result, field, index) => 
      {
        if (field) {
          result[keys[index]] = field;
        }
        return result;
      }, {})
    display(owner, resolver, result) 
  });
}

var address = '0xfEe4D4F0aDFF8D84c12170306507554bC7045878';
var abi = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'string[]',
        name: 'keys',
        type: 'string[]',
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'getData',
    outputs: [
      {
        internalType: 'address',
        name: 'resolver',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'string[]',
        name: 'values',
        type: 'string[]',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  }
];
var provider = ethers.providers.getDefaultProvider('mainnet');
var contract = new ethers.Contract(address, abi, provider);

async function fetchContractData(keys, tokenId) {
  return contract.getData(keys, tokenId);
}

(function() {
  const domainName = getParameterByName('name');
  if (domainName) {
    document.getElementById("domain-input").value = domainName;
  }
})();