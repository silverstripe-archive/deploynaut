<?php

class DeploymentStrategyTest extends SapphireTest {

	public function testEmptyChangesAsDashes() {
		$strategy = new DeploymentStrategy(new DNEnvironment());
		$strategy->setChange('SHA', null, '');
		$strategy->setChange('Var', '-', null);
		$strategy->setChange('Var1', '-', '-');
		$strategy->setChange('Var2', 'legit', 'legit');
		$strategy->setChange('Var3', '0', null);

		$diff = $strategy->toArray();
		$changes = $diff['changes'];

		$this->assertEquals(
			[
				'SHA' => [
					'from' => '',
					'to' => ''
				],
				'Var' => [
					'from' => '',
					'to' => ''
				],
				'Var1' => [
					'from' => '',
					'to' => ''
				],
				'Var2' => [
					'from' => 'legit',
					'to' => 'legit'
				],
				'Var3' => [
					'from' => '0',
					'to' => ''
				]
			],
			$diff['changes']
		);
	}

}
