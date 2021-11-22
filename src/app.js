App = {
    loading: false,
    contracts: {},

    load: async () => {
        await App.loadWeb3()
        // await App.loadAccount()
        await App.loadContract()
        await App.render()
    },

    // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
    loadWeb3: async () => {
        useWeb3 = false;
        try {
            console.info('Expect web3 warning here as checking for web3 in browser which has been deprecated.');
            useWeb3 = (typeof web3 !== 'undefined' && typeof web3.eth !== 'undefined')
            console.info('web3 existence check complete.');
        } catch (error) {

        }
        try {
            // MetaMask still injects a dummy object at window.web3, in order to issue warnings when websites attempt to access window.web3
            // from https://docs.metamask.io/guide/provider-migration.html#table-of-contents
            if (useWeb3) {
                App.web3Provider = web3.currentProvider
                web3 = new Web3(web3.currentProvider)
            } else if (typeof ethereum !== 'undefined') {
                console.log('Using ethereum - modern browser');
                const provider = await detectEthereumProvider()
                if (provider) {
                    App.web3Provider = provider;
                    // window.web3 = new Web3(App.web3Provider);
                } else {
                    window.alert("Please connect to Metamask.")
                }
            } else {
                window.alert("Please connect to Metamask.")
            }
        } catch (error) {
            console.error(error);
        }

        // Modern dapp browsers...
        if (window.ethereum) {
            // window.web3 = new Web3(ethereum)
            try {
                ethereum._metamask.isUnlocked()
                    .then((isUnlocked) => {
                        console.log(isUnlocked);
                        if (isUnlocked) {
                            App.connect();
                        }
                    });


                // Request account access if needed
                // await ethereum.enable()
                // accounts = await ethereum.request('eth_requestAccounts');
                // console.log(accounts);
                // // Acccounts now exposed
                // web3.eth.sendTransaction({/* ... */ })
                // ethereum.on('chainChanged', (chainId) => {
                //     /* handle the chainId */
                // });
            } catch (error) {
                // User denied account access...
                window.user('User denied account access!!!');
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = web3.currentProvider
            window.web3 = new Web3(web3.currentProvider)
            // Acccounts always exposed
            web3.eth.sendTransaction({/* ... */ })
        }
        // Non-dapp browsers...
        else {
            console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
        }
    },

    connect: async () => {
        App.setLoading(true);
        await ethereum
            .request({ method: 'eth_requestAccounts' })
            .then(App.handleAccountsRequestAccepted)
            .then((_) => {
                App.setLoading(false);
                return;
            })
            .catch((error) => {
                App.setLoading(false);
                if (error.code === 4001) {
                    // EIP-1193 userRejectedRequest error
                    console.log('Please reconnect to MetaMask. User logged out due to inactivity or permissions issue.');
                } else {
                    console.error(error);
                }
            });
    },

    handleAccountsRequestAccepted: (accounts) => {
        console.log(accounts);
        App.account = accounts[0];
        App.accounts = accounts;
        ethereum.on('chainChanged', (chainId) => {
            /* handle the chainId */
            App.handleAccountsChanged(chainId);
        });
        return accounts;
    },

    handleAccountsChanged: (chainId) => {
        console.log('Chain ID changed: ' + chainId);
    },

    loadAccount: async () => {
        // Set the current blockchain account
        // App.account = web3.eth.accounts[0]
    },

    loadContract: async () => {
        // Create a JavaScript version of the smart contract
        const todoList = await $.getJSON('TodoList.json')
        App.contracts.TodoList = TruffleContract(todoList)
        App.contracts.TodoList.setProvider(App.web3Provider)

        // Hydrate the smart contract with values from the blockchain
        App.todoList = await App.contracts.TodoList.deployed()
    },

    render: async () => {
        // Prevent double render
        if (App.loading) {
            return;
        }

        // Update app loading state
        App.setLoading(true);

        // Render Account
        $('#account').html(App.account);

        // // Render Tasks
        await App.renderTasks();

        // Update loading state
        App.setLoading(false);
    },

    renderTasks: async () => {
        // Load the total task count from the blockchain
        const taskCount = await App.todoList.taskCount()
        const $taskTemplate = $('.taskTemplate')

        // Render out each task with a new task template
        for (var i = 1; i <= taskCount; i++) {
            // Fetch the task data from the blockchain
            const task = await App.todoList.tasks(i)
            const taskId = task[0].toNumber()
            const taskContent = task[1]
            const taskCompleted = task[2]

            // Create the html for the task
            const $newTaskTemplate = $taskTemplate.clone()
            $newTaskTemplate.find('.content').html(taskContent)
            $newTaskTemplate.find('input')
                .prop('name', taskId)
                .prop('checked', taskCompleted)
            // .on('click', App.toggleCompleted)

            // Put the task in the correct list
            if (taskCompleted) {
                $('#completedTaskList').append($newTaskTemplate)
            } else {
                $('#taskList').append($newTaskTemplate)
            }

            // Show the task
            $newTaskTemplate.show()
        }
    },


    setLoading: (boolean) => {
        App.loading = boolean
        const loader = $('#loader')
        const content = $('#content')
        if (boolean) {
            loader.show()
            content.hide()
        } else {
            loader.hide()
            content.show()
        }
    }
}

$(() => {
    $(window).load(() => {
        App.load()
    })
})