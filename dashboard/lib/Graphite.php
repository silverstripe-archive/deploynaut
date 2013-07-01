<?php

class Graphite {

    protected $time;
    protected $title;
    protected $vtitle;
    protected $metrics = array();
    protected $hide_legend = false;
    protected $hide_grid = false;
    protected $stacked = false;
    protected $y_min = 0;
    protected $y_max = null;
    protected $line_width;
    protected $line_mode = null;
    protected $pie_chart = false;
    protected $base_url = null;

    protected $width = 800;
    protected $height = 600;

    public $deploys = null;
    
    public static function inst() {
        return new Graphite();
    }

    public function __construct() {
        $this->base_url = GraphiteConfig::$graphite_base_url;
        $this->deploys = GraphiteConfig::$graphite_deploys;
    }
    
    public function setTime($time) {
        $this->time = $time;
        return $this;
    } 

    public function setTitle($title) {
        $this->title = $title;
        return $this;
    }

    public function setVTitle($vtitle) {
        $this->vtitle = $vtitle;
        return $this;
    }

    public function setLineMode($mode) {
        $this->line_mode = $mode;
        return $this;
    }

    public function hideLegend($hide) {
        $this->hide_legend = (bool) $hide;
        return $this;
    }

    public function hideGrid($hide) {
        $this->hide_grid = (bool) $hide;
        return $this;
    }

    public function setLineWidth($width) {
        $this->line_width = (int) $width;
        return $this;
    }

    public function displayStacked($stack) {
        $this->stacked = (bool) $stack;
        return $this;
    }

    public function displayPieChart($pie_chart) {
        $this->pie_chart = (bool) $pie_chart;
        return $this;
    }

    // Set y_min to 'null' to unlock from zero
    public function setYMin($y_min) {
        $this->y_min = $y_min;
        return $this;
    }

    public function setYMax($y_max) {
        $this->y_max = $y_max;
        return $this;
    }
    
    public function setSize($width, $height) {
        return $this->setWidth($width)->setHeight($height);
    }
    public function setWidth($width) {
        $this->width = $width;
        return $this;
    }
    public function setHeight($height) {
        $this->height = $height;
        return $this;
    }


    /**
     * Add a metric to the current Graphite object. For Graphite, you can call this
     * method multiple times to stack multiple metrics together in one image.
     */
    public function addMetric($metric, $color = null, $prepend = false) {
        $metric = array(
            'target' => $metric,
            'color' => $color,
        );
        
        if ($prepend) {
            array_unshift($this->metrics, $metric);
        } else {
            $this->metrics[] = $metric;
        }
        return $this;
    }

    /**
     * Convert Dashboard time period to a value usable by Graphite URLs.
     */
    public function getTimeParam() {
        $units = array('h' => 'hours',
            'd' => 'days',
            'w' => 'weeks',
            'm' => 'months',
            'y' => 'years',
        );
        preg_match("/^(\d+)([a-z])/", strtolower($this->time), $m);
        return '-' . $m[1] . $units[$m[2]];
    }

    /**
     * Get Graphite image URL that will display all of the added metrics and deploy lines.
     */
    public function getImageURL($width = null, $height = null, $stand_alone = false) {
			if($width == null) $width = $this->width;
			if($height == null) $height = $this->height;
	
        $p = array(
            'from' => $this->getTimeParam(),
            'width' => $width,
            'height' => $height,
        );
        if ($this->title) {
            $p['title'] = $this->title;
        }
        if ($this->vtitle) {
            $p['vtitle'] = $this->vtitle;
            $p['hideaxes'] = 'false';
        }
        if ($this->hide_legend && !$stand_alone) {
            $p['hideLegend'] = $this->hide_legend;
        }
        if ($this->hide_grid) {
            $p['hideGrid'] = $this->hide_grid;
        }
        if ($this->line_width) {
            $p['lineWidth'] = $this->line_width;
        }
        if ($this->stacked) {
            $p['areaMode'] = 'stacked';
        }
        if ($this->y_min !== null) {
            $p['yMin'] = $this->y_min;
        }
        if ($this->y_max !== null) {
            $p['yMax'] = $this->y_max;
        }
        if ($this->line_mode !== null) {
            $p['lineMode'] = $this->line_mode;
        }
        if ($this->pie_chart) {
            $p['graphType'] = 'pie';
        }

        $targets = array();
        $colors = array();

        foreach ($this->metrics as $m) {
            $targets[] = 'target=' . urlencode($m['target']);
            if ($m['color']) {
                $colors[] = urlencode($m['color']);
            }
        }

        return $this->base_url . '/render?'
            . http_build_query($p)
            . '&' . implode('&', $targets)
            . '&colorList=' . implode(',', $colors);
    }

    /**
     * Return HTML for the current Graphite image, with link to a larger size.
     */
    public function getDashboardHTML($width = null, $height = null, $html_legend = "") {
			if($width == null) $width = $this->width;
			if($height == null) $height = $this->height;
	
        return '<span class="graphiteGraph" style="width: ' . $width . 'px;">'
            . '<a href="' . $this->getImageURL(1024, 768, true) . '">'
            . '<img src="' . $this->getImageURL($width, $height) . '" width="' . $width . '" height="' . $height . '">'
            . ($html_legend ? '<p class="html_legend" style="width: ' . $width . 'px;">' . $html_legend . '</p>' : '')
            . '</a></span>';
    }
}
