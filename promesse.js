/*

Promises/A+ implementation (https://github.com/promises-aplus/promises-spec)
by Valentin Descamps (val1984@gmail.com)

Licensed under the following terms :

           DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
                   Version 2, December 2004

Copyright (C) 2004 Sam Hocevar <sam@hocevar.net>

Everyone is permitted to copy and distribute verbatim or modified
copies of this license document, and changing it is allowed as long
as the name is changed.

           DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
  TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

 0. You just DO WHAT THE FUCK YOU WANT TO.

*/

function Promesse() {
	// State constants
	var PENDING = 0;
	var FULFILLED = 1;
	var REJECTED = -1;

	// State of the promise
	var _etat = PENDING;

	// Value when fulfilled or reason when rejected
	var _valeur;

	// Callbacks arrays
	var _callbacksValide = [];
	var _callbacksRejet = [];

	// `this` is not kept after the constructor has run so we need to keep a reference to it
	var that = this;

	// Helper function for fulfillment and rejection functions

	function changerEtat(etat, callbacks, valeur) {
		if(_etat == PENDING)
		{
			_etat = etat;
			_valeur = valeur;
			while(callbacks.length != 0)
			{
				var fonction = callbacks.shift();
				fonction.call(that, valeur);
			}
		}
	}

	// Delayed callback calling

	function appelCallback(promesse, callback) {
		process.nextTick(function() {
			try {
				var retour = callback.call(null, _valeur);

				if(retour instanceof Object && retour.then && retour.then instanceof Function)
				{
					retour.then(promesse.valider, promesse.rejeter);
				}
				else
					promesse.valider(retour);
			} catch(e) {
				promesse.rejeter(e);
			}
		});
	}

	// Manages the callback to either call it if the promise is resolved or add it to the right callbacks list

	function gestionCallback(promesse, callback, etat) {
		if(_etat == etat)
			appelCallback(promesse, callback);
		else
		{
			var wrapper = function() {
				appelCallback(promesse, callback);
			};

			if(etat == FULFILLED)
				_callbacksValide.push(wrapper);
			else
				_callbacksRejet.push(wrapper);
		}
	}

	// Fulfillment function

	this.valider = function(valeur) {
		changerEtat(FULFILLED, _callbacksValide, valeur);
	}

	// Rejection function

	this.rejeter = function(raison) {
		changerEtat(REJECTED, _callbacksRejet, raison);
	}

	// Then function which adds callbacks for when/if promise is fulfilled/rejected

	this.then = function(quandValidee, quandRejetee) {
		var p = new Promesse();

		if(!(quandValidee instanceof Function))
		{
			// If a non function has been passed, we change it to a pass-through fulfillment function
			quandValidee = function(v) { return v };
		}

		gestionCallback(p, quandValidee, FULFILLED);

		if(!(quandRejetee instanceof Function))
		{
			// If a non function has been passed, we change it to a pass-through rejection function
			quandRejetee = function(v) { throw v };
		}

		gestionCallback(p, quandRejetee, REJECTED);

		return p;
	}
}

// Exports for unit testing using promises-aplus-tests

module.exports.pending = function() {
	var p = new Promesse();
	return {
		promise: p,
		fulfill: function(value) { this.promise.valider(value) },
		reject: function(reason) { this.promise.rejeter(reason) }
	};
}